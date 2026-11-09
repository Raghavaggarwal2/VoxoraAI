import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import ast
import inspect
import unittest

class TestStreamlitAndCoreCompatibility(unittest.TestCase):
    def test_app_py_syntax_and_integrity(self):
        """
        Ensure app.py parses without syntax errors and retains all Streamlit code.
        """
        with open("app.py", "r", encoding="utf-8") as f:
            code = f.read()
        tree = ast.parse(code)
        self.assertIsNotNone(tree)
        self.assertIn("run_pipeline_ui", code)
        self.assertIn("st.set_page_config", code)
        self.assertIn("st.sidebar", code)

    def test_main_py_syntax_and_integrity(self):
        """
        Ensure main.py parses without syntax errors and retains CLI functions.
        """
        with open("main.py", "r", encoding="utf-8") as f:
            code = f.read()
        tree = ast.parse(code)
        self.assertIsNotNone(tree)
        self.assertIn("run_pipeline", code)

    def test_core_signatures_compatibility(self):
        """
        Verify that core modules maintain backwards compatible parameter lists.
        """
        from core.vector_store import build_vector_store, load_vector_store
        from core.rag_engine import build_rag_chain, load_rag_chain
        from utils.audio_processor import process_input, download_youtube_audio, convert_to_wav, chunk_audio

        # build_vector_store must be callable with just transcript
        sig_bvs = inspect.signature(build_vector_store)
        self.assertEqual(list(sig_bvs.parameters.keys())[0], "transcript")
        self.assertTrue(sig_bvs.parameters["collection_name"].default is not inspect.Parameter.empty)

        # build_rag_chain must be callable with just transcript
        sig_brc = inspect.signature(build_rag_chain)
        self.assertEqual(list(sig_brc.parameters.keys())[0], "transcript")
        self.assertTrue(sig_brc.parameters["collection_name"].default is not inspect.Parameter.empty)

        # process_input must be callable with just source
        sig_pi = inspect.signature(process_input)
        self.assertEqual(list(sig_pi.parameters.keys())[0], "source")
        self.assertTrue(sig_pi.parameters["output_dir"].default is None)

if __name__ == "__main__":
    unittest.main()
