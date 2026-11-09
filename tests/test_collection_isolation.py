import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import inspect
import shutil
import tempfile
import unittest
from unittest.mock import patch

from langchain_core.embeddings.fake import FakeEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from core.vector_store import build_vector_store, load_vector_store, get_retriever

class TestCollectionIsolation(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="voxora_test_vector_")
        self.mock_embedding = FakeEmbeddings(size=384)

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_per_job_collection_isolation(self):
        """
        Verify that building vector stores with distinct collection names
        prevents cross-contamination between different jobs.
        """
        transcript_1 = "In this meeting we discussed Project Apollo and the launch of the rocket."
        transcript_2 = "In this separate conference we talked about Project Zeus and weather forecasting."

        with patch("core.vector_store.get_embeddings", return_value=self.mock_embedding):
            # Build isolated store for job 1
            store_1 = build_vector_store(
                transcript_1,
                collection_name="job_test_apollo",
                persist_directory=self.test_dir,
            )
            
            # Build isolated store for job 2
            store_2 = build_vector_store(
                transcript_2,
                collection_name="job_test_zeus",
                persist_directory=self.test_dir,
            )

            retriever_1 = get_retriever(store_1, k=2)
            retriever_2 = get_retriever(store_2, k=2)

            docs_1 = retriever_1.invoke("Apollo")
            self.assertTrue(len(docs_1) > 0)
            self.assertIn("Apollo", docs_1[0].page_content)
            self.assertNotIn("Zeus", docs_1[0].page_content)

            docs_2 = retriever_2.invoke("Zeus")
            self.assertTrue(len(docs_2) > 0)
            self.assertIn("Zeus", docs_2[0].page_content)
            self.assertNotIn("Apollo", docs_2[0].page_content)

    def test_backward_compatibility_defaults(self):
        """
        Verify that calling build_vector_store maintains backward compatibility.
        """
        sig = inspect.signature(build_vector_store)
        self.assertIn("transcript", sig.parameters)
        self.assertIn("collection_name", sig.parameters)
        self.assertEqual(sig.parameters["collection_name"].default, "meeting_transcript")

if __name__ == "__main__":
    unittest.main()
