import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import unittest
from backend.api.routes.health import get_health

class TestHealthEndpoint(unittest.TestCase):
    def test_health_returns_ok(self):
        data = get_health()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("service"), "Voxora AI API")
        self.assertIn("providers", data)
        self.assertIn("groq", data["providers"])
        self.assertIn("groq_whisper", data["providers"])
        self.assertIn("groq_llm", data["providers"])
        self.assertIn("gemini", data["providers"])
        self.assertIn("mistral", data["providers"])

if __name__ == "__main__":
    unittest.main()
