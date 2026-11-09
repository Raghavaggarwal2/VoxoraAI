import os
import shutil
from typing import Any, Dict, List, Optional

def clean_mermaid_mindmap(raw_code: str) -> str:
    """
    Sanitize and wrap Mermaid mindmap node lines so they parse reliably
    without syntax errors, matching the verified logic in app.py:1123-1138.
    """
    if not raw_code:
        return ""
    
    clean_code = raw_code.replace("```mermaid", "").replace("```", "").strip()
    clean_lines = []
    
    for i, line in enumerate(clean_code.split("\n")):
        stripped = line.strip()
        if not stripped or stripped.lower() == "mindmap":
            clean_lines.append(line)
            continue
        
        indent = len(line) - len(line.lstrip())
        text = stripped
        if "((" in text and "))" in text:
            clean_lines.append(line)
        else:
            if text.startswith('"') and text.endswith('"'):
                text = text[1:-1]
            text = text.replace("`", "'")
            clean_lines.append(" " * indent + f'n{i}["`{text}`"]')
            
    return "\n".join(clean_lines)

def process_media_audio(source: str, output_dir: str) -> List[str]:
    """
    Process input source (uploaded media file) into audio chunks
    contained strictly inside output_dir.
    """
    from utils.audio_processor import process_input
    os.makedirs(output_dir, exist_ok=True)
    return process_input(source, output_dir=output_dir)

def transcribe_audio_chunks(chunks: List[str], language: str = "auto") -> str:
    """
    Transcribe audio chunks using Groq whisper-large-v3 via core.transcriber.
    """
    from core.transcriber import transcribe_all
    return transcribe_all(chunks, language=language)

def analyze_meeting_content(transcript: str) -> Dict[str, str]:
    """
    Run core summarization, title generation, and structured extractions.
    Uses mistral-medium-latest for summary and title, and mistral-small-latest
    for action items, decisions, questions, and mind map.
    """
    from core.summarize import summarize, generate_title
    from core.extractor import (
        extract_actionable_items,
        extract_key_decisions,
        extract_questions,
        extract_mindmap,
    )
    
    title = generate_title(transcript)
    summary_text = summarize(transcript)
    action_items = extract_actionable_items(transcript)
    key_decisions = extract_key_decisions(transcript)
    questions = extract_questions(transcript)
    # Following verified app.py behavior: pass summary to extract_mindmap
    raw_mindmap = extract_mindmap(summary_text)
    sanitized_mindmap = clean_mermaid_mindmap(raw_mindmap)

    return {
        "title": title,
        "summary": summary_text,
        "action_items": action_items,
        "key_decisions": key_decisions,
        "questions": questions,
        "mindmap": sanitized_mindmap,
        "raw_mindmap": raw_mindmap,
    }

def build_job_rag(transcript: str, collection_name: str) -> Any:
    """
    Build an isolated RAG chain scoped specifically to collection_name.
    """
    from core.rag_engine import build_rag_chain
    return build_rag_chain(transcript, collection_name=collection_name)

def ask_job_question(rag_chain: Any, question: str) -> str:
    """
    Query the RAG chain for the active source context.
    """
    from core.rag_engine import ask_question
    return ask_question(rag_chain, question)

def cleanup_job_directory(job_dir: Optional[str]) -> None:
    """
    Safely delete the isolated job temporary directory and its contents.
    Never touches downloads/ or vector_db/.
    """
    if job_dir and os.path.exists(job_dir):
        try:
            shutil.rmtree(job_dir, ignore_errors=True)
            print(f"Cleaned up job temporary directory: {job_dir}")
        except Exception as e:
            print(f"Warning: Failed to clean up job directory {job_dir}: {e}")
