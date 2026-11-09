import unittest
from pydantic import ValidationError
from backend.schemas.jobs import JobStage, JobStatus, JobCreateResponse, JobStatusResponse
from backend.schemas.chat import ChatRequest
from backend.schemas.errors import ErrorDetail, ErrorEnvelope

class TestSchemas(unittest.TestCase):
    def test_job_create_response_serialization(self):
        resp = JobCreateResponse(
            job_id="test-job-456",
            status=JobStatus.QUEUED,
            stage=JobStage.QUEUED,
            message="Media upload job created successfully",
            source_attribution="Groq Whisper (Local Media)",
        )
        d = resp.model_dump()
        self.assertEqual(d["job_id"], "test-job-456")
        self.assertEqual(d["status"], "queued")
        self.assertEqual(d["stage"], "queued")
        self.assertEqual(d["source_attribution"], "Groq Whisper (Local Media)")

    def test_job_status_response_serialization(self):
        resp = JobStatusResponse(
            job_id="test-job-456",
            status=JobStatus.PROCESSING,
            stage=JobStage.PREPARING_AUDIO,
            progress_percent=15,
            status_message="Converting audio...",
            created_at="2026-11-09T00:00:00Z",
            source_attribution="Groq Whisper (Local Media)",
        )
        d = resp.model_dump()
        self.assertEqual(d["progress_percent"], 15)
        self.assertEqual(d["stage"], "preparing_audio")
        self.assertIsNone(d["completed_at"])
        self.assertIsNone(d["error"])

    def test_job_stages_definition(self):
        # Verify local media stages exist
        stages = [s.value for s in JobStage]
        self.assertIn("queued", stages)
        self.assertIn("preparing_audio", stages)
        self.assertIn("transcribing", stages)
        self.assertIn("analyzing", stages)
        self.assertIn("indexing", stages)
        self.assertIn("completed", stages)
        self.assertIn("failed", stages)

    def test_chat_request_validation(self):
        # Empty question should fail
        with self.assertRaises(ValidationError):
            ChatRequest(question="")

        valid = ChatRequest(question="What was decided?")
        self.assertEqual(valid.question, "What was decided?")

    def test_error_envelope_serialization(self):
        err = ErrorDetail(code="TEST_ERROR", message="Something broke", retryable=True)
        env = ErrorEnvelope(error=err)
        d = env.model_dump()
        self.assertIn("error", d)
        self.assertEqual(d["error"]["code"], "TEST_ERROR")
        self.assertTrue(d["error"]["retryable"])

if __name__ == "__main__":
    unittest.main()
