import json
import os
import shutil
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Generator, Optional

from backend.config import settings

# Data directory outside of Python package tree so uvicorn --reload never restarts on database writes
DATA_DIR = settings.BASE_DIR / "data"
JOBS_DB_PATH = DATA_DIR / "jobs.sqlite3"
LEGACY_JOBS_DB_PATH = settings.BASE_DIR / "backend" / "jobs.sqlite3"


class JobStore:
    """
    Lightweight SQLite storage for FastAPI AI processing job metadata and results.
    Preserves job state across FastAPI restarts so that:
    1. Completed jobs and results remain retrievable.
    2. Persistent ChromaDB vector sessions rebind seamlessly for RAG chat.
    3. Interrupted jobs are accurately reported as failed with retry guidance.
    """

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or JOBS_DB_PATH
        self._init_db()

    @contextmanager
    def _get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        conn = sqlite3.connect(str(self.db_path), timeout=10.0, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            with conn:
                yield conn
        finally:
            conn.close()

    def _init_db(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        # Migrate existing legacy DB from backend/jobs.sqlite3 to data/jobs.sqlite3 if needed
        if LEGACY_JOBS_DB_PATH.exists() and not self.db_path.exists():
            try:
                shutil.copy2(LEGACY_JOBS_DB_PATH, self.db_path)
                print(f"Migrated legacy jobs database to {self.db_path}")
            except Exception as e:
                print(f"Notice: Failed to migrate legacy jobs database: {e}")
        # Clean up legacy db to avoid triggering uvicorn reload
        if LEGACY_JOBS_DB_PATH.exists():
            try:
                LEGACY_JOBS_DB_PATH.unlink(missing_ok=True)
            except Exception:
                pass
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS jobs (
                    job_id TEXT PRIMARY KEY,
                    source TEXT,
                    source_type TEXT,
                    language TEXT,
                    collection_name TEXT,
                    source_attribution TEXT,
                    status TEXT,
                    stage TEXT,
                    progress_percent INTEGER,
                    status_message TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    completed_at TEXT,
                    error_json TEXT,
                    transcript TEXT,
                    results_json TEXT
                )
                """
            )

    def save_job(self, job: Any) -> None:
        """Persist or update job state in SQLite."""
        error_json = None
        if job.error:
            if hasattr(job.error, "model_dump"):
                error_json = json.dumps(job.error.model_dump())
            elif isinstance(job.error, dict):
                error_json = json.dumps(job.error)

        results_json = json.dumps(job.results) if job.results else None

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO jobs (
                    job_id, source, source_type, language, collection_name,
                    source_attribution, status, stage, progress_percent, status_message,
                    created_at, updated_at, completed_at, error_json, transcript, results_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(job_id) DO UPDATE SET
                    status = excluded.status,
                    stage = excluded.stage,
                    progress_percent = excluded.progress_percent,
                    status_message = excluded.status_message,
                    updated_at = excluded.updated_at,
                    completed_at = excluded.completed_at,
                    error_json = excluded.error_json,
                    transcript = excluded.transcript,
                    results_json = excluded.results_json
                """,
                (
                    job.job_id,
                    job.source,
                    job.source_type,
                    job.language,
                    job.collection_name,
                    job.source_attribution,
                    job.status.value if hasattr(job.status, "value") else str(job.status),
                    job.stage.value if hasattr(job.stage, "value") else str(job.stage),
                    job.progress_percent,
                    job.status_message,
                    job.created_at,
                    job.updated_at,
                    job.completed_at,
                    error_json,
                    job.transcript,
                    results_json,
                ),
            )

    def load_job_data(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve raw job row from SQLite."""
        with self._get_connection() as conn:
            cur = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
            row = cur.fetchone()
            if not row:
                return None
            return dict(row)

    def delete_job(self, job_id: str) -> None:
        """Delete job record from SQLite."""
        with self._get_connection() as conn:
            conn.execute("DELETE FROM jobs WHERE job_id = ?", (job_id,))

    def mark_interrupted_jobs_failed(self) -> int:
        """
        On server startup, safely marks any jobs that were interrupted in 'queued' or
        'processing' state as 'failed' instead of hanging indefinitely.
        """
        with self._get_connection() as conn:
            cur = conn.execute(
                """
                UPDATE jobs
                SET status = 'failed',
                    stage = 'failed',
                    status_message = 'Backend was restarted while processing this job. Please retry.',
                    error_json = ?
                WHERE status IN ('queued', 'processing')
                """,
                (
                    json.dumps({
                        "code": "SERVER_RESTARTED",
                        "message": "Backend server was restarted while processing was active. Please retry analysis.",
                        "retryable": True,
                    }),
                ),
            )
            return cur.rowcount


job_store = JobStore()
