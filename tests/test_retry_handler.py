import unittest
from utils.retry_handler import parse_json_response, invoke_with_retry, normalize_groq_model

class TestRetryHandler(unittest.TestCase):
    def test_normalize_groq_model(self):
        self.assertEqual(normalize_groq_model("gpt-oss-20b"), "openai/gpt-oss-20b")
        self.assertEqual(normalize_groq_model("openai/gpt-oss-20b"), "openai/gpt-oss-20b")
        self.assertEqual(normalize_groq_model("llama-3.1-8b-instant"), "llama-3.1-8b-instant")
        self.assertEqual(normalize_groq_model(None), "openai/gpt-oss-20b")
    def test_parse_json_with_fences(self):
        sample = '```json\n{"title": "Test Title", "summary": "Test Summary"}\n```'
        result = parse_json_response(sample)
        self.assertEqual(result["title"], "Test Title")
        self.assertEqual(result["summary"], "Test Summary")

    def test_parse_json_raw(self):
        sample = '{"title": "Raw Title", "action_items": "1. Task"}'
        result = parse_json_response(sample)
        self.assertEqual(result["title"], "Raw Title")
        self.assertEqual(result["action_items"], "1. Task")

    def test_invoke_with_retry_success(self):
        def sample_fn(x):
            return x * 2
        res = invoke_with_retry(sample_fn, 5)
        self.assertEqual(res, 10)

if __name__ == "__main__":
    unittest.main()

