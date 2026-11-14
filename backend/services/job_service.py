import json
import os
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid

from backend.config import settings
from backend.schemas.errors import ErrorDetail
from backend.schemas.jobs import JobStage, JobStatus
from backend.services.adapters import (
    process_media_audio,
    transcribe_audio_chunks,
    analyze_meeting_content,
    build_job_rag,
    ask_job_question,
    cleanup_job_directory,
)
from backend.services.job_store import job_store


class Job:
    def __init__(
        self,
        job_id: str,
        source: str,
        source_type: str,
        language: str = "auto",
        temp_dir: Optional[str] = None,
    ):
        self.job_id = job_id
        self.source = source
        self.source_type = source_type
        self.language = language
        self.temp_dir = temp_dir
        self.collection_name = f"job_{job_id.replace('-', '_')}"
        self.source_attribution = "Groq Whisper (Local Media)"
        
        self.status = JobStatus.QUEUED
        self.stage = JobStage.QUEUED
        self.progress_percent = 0
        self.status_message = "Job queued for processing"
        
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.updated_at = self.created_at
        self.completed_at: Optional[str] = None
        
        self.error: Optional[ErrorDetail] = None
        
        # Results
        self.transcript: Optional[str] = None
        self.results: Optional[Dict[str, Any]] = None
        self.rag_chain: Optional[Any] = None

    def update_stage(self, stage: JobStage, status: JobStatus, progress: int, message: str) -> None:
        self.stage = stage
        self.status = status
        self.progress_percent = progress
        self.status_message = message
        self.updated_at = datetime.now(timezone.utc).isoformat()
        job_store.save_job(self)

    def set_completed(self, transcript: str, results: Dict[str, Any], rag_chain: Any) -> None:
        self.transcript = transcript
        self.results = results
        self.rag_chain = rag_chain
        self.status = JobStatus.COMPLETED
        self.stage = JobStage.COMPLETED
        self.progress_percent = 100
        self.status_message = "Analysis complete"
        now = datetime.now(timezone.utc).isoformat()
        self.updated_at = now
        self.completed_at = now
        job_store.save_job(self)

    def set_failed(self, code: str, message: str, retryable: bool = False) -> None:
        self.status = JobStatus.FAILED
        self.stage = JobStage.FAILED
        self.status_message = f"Failed: {message}"
        self.error = ErrorDetail(code=code, message=message, retryable=retryable)
        now = datetime.now(timezone.utc).isoformat()
        self.updated_at = now
        self.completed_at = now
        job_store.save_job(self)


class JobManager:
    def __init__(self, max_workers: int = 2):
        self._jobs: Dict[str, Job] = {}
        self._lock = threading.Lock()
        self._executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="voxora_worker_")
        # On initialization, mark interrupted/stale running jobs as failed cleanly
        interrupted = job_store.mark_interrupted_jobs_failed()
        if interrupted > 0:
            print(f"Notice: Marked {interrupted} interrupted job(s) from previous session as failed.")

    def create_job(self, source: str, source_type: str, language: str = "auto") -> Job:
        job_id = str(uuid.uuid4())
        job_temp_dir = tempfile.mkdtemp(prefix=f"voxora_job_{job_id[:8]}_")
        
        job = Job(
            job_id=job_id,
            source=source,
            source_type=source_type,
            language=language,
            temp_dir=job_temp_dir,
        )
        
        with self._lock:
            self._jobs[job_id] = job
            job_store.save_job(job)
            
        # Submit to background executor
        self._executor.submit(self._run_job_pipeline, job_id)
        return job

    def get_job(self, job_id: str) -> Optional[Job]:
        with self._lock:
            cached = self._jobs.get(job_id)
            if cached:
                return cached

        # Check SQLite persistent store if not in memory (e.g. after server restart)
        row = job_store.load_job_data(job_id)
        if not row:
            return None

        # Reconstruct Job instance from persisted row
        job = Job(
            job_id=row["job_id"],
            source=row["source"],
            source_type=row["source_type"],
            language=row["language"] or "auto",
        )
        job.collection_name = row["collection_name"]
        job.source_attribution = row["source_attribution"] or "Groq Whisper (Local Media)"
        job.status = JobStatus(row["status"])
        job.stage = JobStage(row["stage"])
        job.progress_percent = row["progress_percent"] or 0
        job.status_message = row["status_message"] or ""
        job.created_at = row["created_at"]
        job.updated_at = row["updated_at"]
        job.completed_at = row["completed_at"]
        job.transcript = row["transcript"]

        if row["results_json"]:
            try:
                job.results = json.loads(row["results_json"])
            except Exception:
                job.results = None

        if row["error_json"]:
            try:
                err_dict = json.loads(row["error_json"])
                job.error = ErrorDetail(**err_dict)
            except Exception:
                job.error = None

        # Note: RAG chain is lazily resolved in ask_question() to avoid heavy model loads during status polls

        with self._lock:
            self._jobs[job_id] = job

        return job

    def ask_question(self, job_id: str, question: str, return_sources: bool = False):
        job = self.get_job(job_id)
        collection_name = f"job_{job_id.replace('-', '_')}"
        rag_chain = None

        if job and job.status == JobStatus.COMPLETED and job.rag_chain:
            rag_chain = job.rag_chain
        else:
            # Fallback: check if persistent ChromaDB collection exists on disk
            try:
                import chromadb
                client = chromadb.PersistentClient(path=settings.VECTOR_DB_DIR.as_posix())
                existing_cols = [c.name for c in client.list_collections()]
                if collection_name in existing_cols:
                    from core.rag_engine import load_rag_chain
                    rag_chain = load_rag_chain(collection_name=collection_name)
            except Exception as e:
                print(f"Notice: Persistent collection lookup error: {e}")

        if not rag_chain:
            if not job:
                raise KeyError(f"Job {job_id} not found")
            if job.status != JobStatus.COMPLETED:
                raise ValueError(f"Job {job_id} is not completed (current status: {job.status.value})")
            raise ValueError(f"Job {job_id} does not have an active RAG knowledge base")

        if return_sources:
            from backend.services.adapters import ask_job_question_with_sources
            return ask_job_question_with_sources(rag_chain, question, collection_name=collection_name)
            
        return ask_job_question(rag_chain, question)

    def delete_job(self, job_id: str) -> bool:
        with self._lock:
            job = self._jobs.pop(job_id, None)

        job_store.delete_job(job_id)

        collection_name = f"job_{job_id.replace('-', '_')}"
        try:
            from backend.services.adapters import delete_job_vectors
            delete_job_vectors(collection_name)
        except Exception as e:
            print(f"Warning: Failed to clean up vector store for {collection_name}: {e}")

        if job and job.temp_dir:
            cleanup_job_directory(job.temp_dir)
        return True

    def _run_job_pipeline(self, job_id: str) -> None:
        job = self.get_job(job_id)
        if not job:
            return

        print(f"[{job_id}] Starting pipeline execution for source: {job.source[:80]}...")
        
        try:
            # Check credentials early
            whisper_key = os.getenv("GROQ_WHISPER_API_KEY") or os.getenv("GROQ_API_KEY")
            if not whisper_key:
                job.set_failed("CONFIGURATION_ERROR", "GROQ_API_KEY (or GROQ_WHISPER_API_KEY) is not configured on the server")
                return
            llm_key = (
                os.getenv("GROQ_LLM_API_KEY")
                or os.getenv("GROQ_API_KEY_2")
                or os.getenv("GROQ_API_KEY")
            )
            if not llm_key:
                job.set_failed("CONFIGURATION_ERROR", "GROQ_LLM_API_KEY (or GROQ_API_KEY) is not configured on the server")
                return

            # Stage 1: Audio Prep
            job.update_stage(JobStage.PREPARING_AUDIO, JobStatus.PROCESSING, 15, "Converting and preparing audio...")

            try:
                chunks = process_media_audio(job.source, job.temp_dir)
            except Exception as e:
                from utils.audio_processor import (
                    NoAudioStreamError,
                    EmptyAudioError,
                    YouTubeVerificationRequiredError,
                    YouTubeAccessDeniedError,
                )
                print(f"[{job_id}] Audio processing error: {e}")
                if isinstance(e, NoAudioStreamError):
                    job.set_failed(
                        "NO_AUDIO_STREAM",
                        str(e),
                        retryable=False,
                    )
                elif isinstance(e, EmptyAudioError):
                    job.set_failed(
                        "EMPTY_AUDIO",
                        str(e),
                        retryable=False,
                    )
                elif isinstance(e, (YouTubeVerificationRequiredError, YouTubeAccessDeniedError)):
                    job.set_failed(
                        "YOUTUBE_EXTRACTION_FAILED",
                        str(e),
                        retryable=False,
                    )
                else:
                    job.set_failed(
                        "AUDIO_PROCESSING_ERROR",
                        f"Failed to process media audio: {str(e)}",
                        retryable=False,
                    )
                return

            if not chunks:
                job.set_failed("AUDIO_PROCESSING_ERROR", "Failed to extract valid audio chunks from source")
                return

            # Stage 2: Speech Transcription
            job.update_stage(JobStage.TRANSCRIBING, JobStatus.PROCESSING, 40, f"Transcribing {len(chunks)} audio segment(s) with Whisper...")
            transcript = transcribe_audio_chunks(chunks, language=job.language)
            if not transcript or not transcript.strip():
                job.set_failed("TRANSCRIPTION_EMPTY", "Transcription produced no text from the audio source")
                return

            # Stage 3: Structured AI Analysis
            job.update_stage(JobStage.ANALYZING, JobStatus.PROCESSING, 70, "Generating summary, action items, decisions, and mind map...")
            analysis_results = analyze_meeting_content(transcript)

            # Stage 4: Scoped Vector Indexing & RAG Chain
            job.update_stage(JobStage.INDEXING, JobStatus.PROCESSING, 90, "Building isolated knowledge base for Q&A...")
            rag_chain = build_job_rag(transcript, collection_name=job.collection_name)

            # Stage 5: Completed
            job.set_completed(transcript=transcript, results=analysis_results, rag_chain=rag_chain)
            print(f"[{job_id}] Pipeline completed successfully.")

        except Exception as e:
            print(f"[{job_id}] Pipeline error: {e}")
            job.set_failed("PROCESSING_FAILED", str(e), retryable=False)
        finally:
            # Clean up the isolated temporary audio chunks
            cleanup_job_directory(job.temp_dir)


job_manager = JobManager(max_workers=2)
