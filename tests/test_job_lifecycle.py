import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import tempfile
import unittest
from backend.schemas.jobs import JobStage, JobStatus
from backend.services.job_service import Job, JobManager
from backend.services.adapters import cleanup_job_directory

class TestJobLifecycle(unittest.TestCase):
    def test_job_transitions(self):
        job = Job(
            job_id="test-job-123",
            source="meeting.mp4",
            source_type="upload",
            language="auto",
        )
        self.assertEqual(job.status, JobStatus.QUEUED)
        self.assertEqual(job.stage, JobStage.QUEUED)
        self.assertEqual(job.progress_percent, 0)
        self.assertEqual(job.collection_name, "job_test_job_123")
        self.assertEqual(job.source_attribution, "Groq Whisper (Local Media)")

        # Stage progression
        job.update_stage(JobStage.PREPARING_AUDIO, JobStatus.PROCESSING, 15, "Converting audio...")
        self.assertEqual(job.status, JobStatus.PROCESSING)
        self.assertEqual(job.stage, JobStage.PREPARING_AUDIO)
        self.assertEqual(job.progress_percent, 15)

        # Complete
        fake_results = {
            "title": "Test Title",
            "summary": "Test Summary",
            "action_items": "1. Do work",
            "key_decisions": "1. Ship it",
            "questions": "1. What next?",
            "mindmap": "mindmap",
        }
        job.set_completed(transcript="Hello world transcript", results=fake_results, rag_chain="mock_chain")
        self.assertEqual(job.status, JobStatus.COMPLETED)
        self.assertEqual(job.stage, JobStage.COMPLETED)
        self.assertEqual(job.progress_percent, 100)
        self.assertIsNotNone(job.completed_at)
        self.assertEqual(job.results["title"], "Test Title")

    def test_job_failure(self):
        job = Job(
            job_id="test-job-fail",
            source="bad_file.wav",
            source_type="upload",
        )
        job.set_failed("FFMPEG_ERROR", "Audio conversion failed", retryable=False)
        self.assertEqual(job.status, JobStatus.FAILED)
        self.assertEqual(job.stage, JobStage.FAILED)
        self.assertIsNotNone(job.error)
        self.assertEqual(job.error.code, "FFMPEG_ERROR")
        self.assertEqual(job.error.message, "Audio conversion failed")

    def test_isolated_temp_dir_cleanup(self):
        """
        Verify that cleanup_job_directory safely removes the job directory
        without deleting existing persistent directories.
        """
        temp_dir = tempfile.mkdtemp(prefix="voxora_test_cleanup_")
        test_file = os.path.join(temp_dir, "chunk_0.wav")
        with open(test_file, "w") as f:
            f.write("dummy audio content")

        self.assertTrue(os.path.exists(test_file))
        cleanup_job_directory(temp_dir)
        self.assertFalse(os.path.exists(temp_dir))

        # Verify persistent directories remain intact
        self.assertTrue(os.path.exists("downloads"))
        self.assertTrue(os.path.exists("vector_db"))

    def test_job_persistence_and_server_restart_recovery(self):
        """
        Verify that job state persisted to SQLite survives memory wipe (server restart),
        and completed results and status remain retrievable.
        """
        from backend.services.job_service import job_manager

        test_id = "test-restart-recovery-999"
        job = Job(
            job_id=test_id,
            source="demo_presentation.mp4",
            source_type="upload",
            language="en",
        )
        fake_results = {
            "title": "Persistent Demo",
            "summary": "This summary survives backend restart",
            "action_items": "1. Verify SQLite persistence",
            "key_decisions": "1. Keep local Dexie as primary",
            "questions": "1. Did it survive?",
            "mindmap": "mindmap\n  root((Persistent))",
        }
        job.set_completed(
            transcript="Sample transcript surviving restart",
            results=fake_results,
            rag_chain=None,
        )

        # Simulate backend restart by wiping memory cache
        with job_manager._lock:
            job_manager._jobs.pop(test_id, None)

        # Retrieve job: should recover from SQLite
        recovered = job_manager.get_job(test_id)
        self.assertIsNotNone(recovered)
        self.assertEqual(recovered.job_id, test_id)
        self.assertEqual(recovered.status, JobStatus.COMPLETED)
        self.assertEqual(recovered.transcript, "Sample transcript surviving restart")
        self.assertEqual(recovered.results["title"], "Persistent Demo")

        # Clean up
        job_manager.delete_job(test_id)
        self.assertIsNone(job_manager.get_job(test_id))

if __name__ == "__main__":
    unittest.main()
