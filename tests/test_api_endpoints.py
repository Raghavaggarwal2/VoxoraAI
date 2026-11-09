import io
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import unittest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException, UploadFile

from backend.api.routes.jobs import submit_upload_job, get_job_status
from backend.api.routes.results import (
    get_job_results,
    get_job_transcript,
    get_job_mindmap,
    download_transcript,
)
from backend.api.routes.chat import ask_job_question_endpoint
from backend.schemas.jobs import JobStatus
from backend.schemas.chat import ChatRequest
from backend.services.job_service import job_manager, Job

class TestAPIEndpoints(unittest.TestCase):
    def test_submit_upload_invalid_extension(self):
        fake_file = UploadFile(filename="virus.exe", file=io.BytesIO(b"content"))
        with self.assertRaises(HTTPException) as ctx:
            submit_upload_job(file=fake_file, language="auto")
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(ctx.exception.detail["code"], "INVALID_FILE_TYPE")

    def test_submit_upload_valid_file(self):
        fake_file = UploadFile(filename="audio.wav", file=io.BytesIO(b"RIFFWAVEcontent"))
        with patch.object(job_manager._executor, "submit"):
            res = submit_upload_job(file=fake_file, language="hi")
            self.assertIsNotNone(res.job_id)
            self.assertEqual(res.status, JobStatus.QUEUED)
            self.assertEqual(res.source_attribution, "Groq Whisper (Local Media)")

    def test_get_nonexistent_job_status(self):
        with self.assertRaises(HTTPException) as ctx:
            get_job_status("nonexistent-uuid")
        self.assertEqual(ctx.exception.status_code, 404)
        self.assertEqual(ctx.exception.detail["code"], "JOB_NOT_FOUND")

    def test_results_and_chat_for_completed_job(self):
        job = Job(
            job_id="test-e2e-completed",
            source="meeting.mp4",
            source_type="upload",
        )
        fake_results = {
            "title": "Quantum Computing 101",
            "summary": "Introduction to qubits and superposition.",
            "action_items": "1. Review notes by Friday",
            "key_decisions": "1. Adopt Python for simulations",
            "questions": "1. How to scale error correction?",
            "mindmap": 'mindmap\n  root(("Quantum"))\n    n1["`Qubits`"]',
        }
        mock_chain = MagicMock()
        mock_chain.invoke.return_value = "Superposition enables parallel state evaluation."
        job.set_completed(
            transcript="This is the full quantum transcript about qubits and error correction.",
            results=fake_results,
            rag_chain=mock_chain,
        )

        with job_manager._lock:
            job_manager._jobs[job.job_id] = job

        # 1. Get Status
        status_res = get_job_status(job.job_id)
        self.assertEqual(status_res.status, JobStatus.COMPLETED)
        self.assertEqual(status_res.progress_percent, 100)
        self.assertEqual(status_res.source_attribution, "Groq Whisper (Local Media)")

        # 2. Get Results
        results_res = get_job_results(job.job_id)
        self.assertEqual(results_res.title, "Quantum Computing 101")
        self.assertIn("qubits", results_res.summary)
        self.assertEqual(results_res.word_count, 11)
        self.assertTrue(results_res.has_transcript)
        self.assertEqual(results_res.source_attribution, "Groq Whisper (Local Media)")

        # 3. Get Transcript
        tx_res = get_job_transcript(job.job_id)
        self.assertIn("quantum transcript", tx_res.transcript)
        self.assertEqual(tx_res.word_count, 11)
        self.assertEqual(tx_res.source_attribution, "Groq Whisper (Local Media)")

        # 4. Get Mind Map
        mm_res = get_job_mindmap(job.job_id)
        self.assertIn("Quantum", mm_res.mindmap)

        # 5. Download Transcript
        dl_res = download_transcript(job.job_id)
        self.assertEqual(dl_res.status_code, 200)
        self.assertIn("attachment", dl_res.headers["content-disposition"])
        self.assertIn("quantum transcript", dl_res.body.decode("utf-8"))

        # 6. Ask Chat Question
        chat_req = ChatRequest(question="What is superposition?")
        chat_res = ask_job_question_endpoint(job.job_id, chat_req)
        self.assertEqual(chat_res.question, "What is superposition?")
        self.assertEqual(chat_res.answer, "Superposition enables parallel state evaluation.")

    def test_results_for_pending_job_raises_409(self):
        job = Job(
            job_id="test-pending",
            source="meeting.mp4",
            source_type="upload",
        )
        with job_manager._lock:
            job_manager._jobs[job.job_id] = job

        with self.assertRaises(HTTPException) as ctx:
            get_job_results(job.job_id)
        self.assertEqual(ctx.exception.status_code, 409)

if __name__ == "__main__":
    unittest.main()
