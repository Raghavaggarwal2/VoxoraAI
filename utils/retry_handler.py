import json
import logging
import re
import time
from typing import Any, Callable

logger = logging.getLogger(__name__)

def normalize_groq_model(model_name: str | None) -> str:
    """
    Normalize Groq model identifiers so shorthands like 'gpt-oss-20b'
    automatically resolve to 'openai/gpt-oss-20b'.
    """
    if not model_name:
        return "openai/gpt-oss-20b"
    cleaned = model_name.strip()
    if cleaned in ("gpt-oss-20b", "gpt_oss_20b", "oss-20b"):
        return "openai/gpt-oss-20b"
    if cleaned in ("gpt-oss-120b", "gpt_oss_120b", "oss-120b"):
        return "openai/gpt-oss-120b"
    return cleaned

def invoke_with_retry(
    target: Any,
    input_data: Any = None,
    max_retries: int = 3,
    default_delay: float = 30.0,
    **kwargs,
) -> Any:
    """
    Invoke a LangChain Runnable (chain.invoke) or a callable with automatic
    backoff and retry for 429 / RESOURCE_EXHAUSTED rate limit errors.
    """
    for attempt in range(max_retries + 1):
        try:
            if hasattr(target, "invoke"):
                if input_data is not None:
                    return target.invoke(input_data, **kwargs)
                return target.invoke(**kwargs)
            elif callable(target):
                if input_data is not None:
                    return target(input_data, **kwargs)
                return target(**kwargs)
            else:
                raise TypeError(f"Target {type(target)} is neither callable nor a Runnable with invoke().")
        except Exception as exc:
            err_str = str(exc)
            is_rate_limit = (
                "429" in err_str
                or "RESOURCE_EXHAUSTED" in err_str
                or "quota exceeded" in err_str.lower()
            )
            if not is_rate_limit or attempt >= max_retries:
                raise

            delay = default_delay
            # Look for explicit retry suggestions from Google error payload
            # e.g., "retry in 35.113864088s"
            match = re.search(r"retry in ([\d\.]+)s", err_str, re.IGNORECASE)
            if match:
                try:
                    delay = float(match.group(1)) + 1.5
                except (ValueError, TypeError):
                    delay = default_delay
            else:
                # e.g., "'retryDelay': '35s'"
                delay_match = re.search(r"retryDelay['\"]?:\s*['\"](\d+)s", err_str, re.IGNORECASE)
                if delay_match:
                    try:
                        delay = float(delay_match.group(1)) + 1.5
                    except (ValueError, TypeError):
                        delay = default_delay
                else:
                    delay = min(60.0, default_delay * (attempt + 1))

            logger.warning(
                f"[RateLimit] 429 RESOURCE_EXHAUSTED encountered. Waiting {delay:.1f}s before retry "
                f"(attempt {attempt + 1}/{max_retries})..."
            )
            time.sleep(delay)

def parse_json_response(text: str) -> dict:
    """
    Safely extract and parse JSON from an LLM response string.
    Strips markdown code fences (```json ... ```) if present.
    """
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except Exception:
        # Fallback: scan for outermost JSON object brackets
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise

