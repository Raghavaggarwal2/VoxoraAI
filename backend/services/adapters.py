import os
import re
import shutil
from typing import Any, Dict, List, Optional

def clean_mermaid_mindmap(raw_code: str) -> str:
    """
    Sanitize and format Mermaid mindmap nodes so they parse reliably
    without syntax or lexical errors. Preserves existing valid shapes and heals
    nested double-wrapping.
    """
    if not raw_code:
        return ""
    
    clean_code = raw_code.replace("```mermaid", "").replace("```", "").strip()

    # Heal any double-wrapped nodes: n1["`root["..."]`"] -> root["..."]
    clean_code = re.sub(r'n\d+\["`\s*([a-zA-Z0-9_-]+\[".*?"\])\s*`"\]', r'\1', clean_code)

    clean_lines = []
    for i, line in enumerate(clean_code.split("\n")):
        stripped = line.strip()
        if not stripped or stripped.lower() == "mindmap":
            clean_lines.append(line)
            continue
        
        indent = len(line) - len(line.lstrip())
        text = stripped

        # If already formatted with any valid Mermaid node shape, preserve it
        has_shape = bool(
            re.search(r'\(\(.*?\)\)|\[.*?\]|\(.*?\)|{{.*?}}|\)\).*?\(\(', text)
        )
        if has_shape:
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
    Uses Groq (openai/gpt-oss-20b) for a single-pass comprehensive structured analysis,
    consuming only 1 API request and delivering ultra-fast responses (~1,000 tokens/sec).
    Falls back gracefully to individual extractors with retry if needed.
    """
    from utils.retry_handler import invoke_with_retry, parse_json_response
    from core.summarize import get_llm
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser

    unified_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert executive meeting analyst and summarizer.
Analyze the provided meeting transcript thoroughly and return a valid JSON object with EXACTLY the following keys:

1. "title": A catchy, descriptive, and highly professional title (max 6-8 words) capturing the core essence of the meeting.
2. "summary": A detailed, comprehensive, professional meeting summary formatted in clean Markdown. Use bold subheadings and detailed bullet points for each major topic discussed. Capture the true depth, context, and nuances of the discussion. DO NOT include sections for Action Items, Key Decisions, Open Questions, or Key Takeaways in this summary text.
3. "action_items": A clean Markdown numbered list of all actionable tasks mentioned. For each item provide:
   - Task description
   - Owner (who is responsible)
   - Deadline (if mentioned, else 'Not specified')
   If none are found, exactly output: "No action items found."
4. "key_decisions": A clean Markdown numbered list of all decisive choices, resolutions, or conclusions reached. If none are found, exactly output: "No key decisions found."
5. "questions": A clean Markdown numbered list of all unresolved questions, open issues, or topics needing follow-up. If none are found, exactly output: "No open questions found."
6. "mindmap": A concise Mermaid.js mindmap diagram representing the meeting structure.
   CRITICAL Mermaid syntax rules:
   - Start with the exact line `mindmap`
   - Use 2-3 hierarchy levels only
   - Node labels must be short phrases (1-4 words max)
   - Wrap EVERY node text in double quotes to prevent syntax errors (e.g., `id["My Topic"]`)
   - Return only the raw mermaid diagram content without enclosing markdown triple-backticks.

Ensure the entire output is valid, parseable JSON."""),
        ("human", "{text}")
    ])

    llm = get_llm()
    try:
        try:
            chain = unified_prompt | llm | StrOutputParser()
            raw_response = invoke_with_retry(chain, {"text": transcript})
        except Exception as exc:
            err_str = str(exc).lower()
            if "model_not_found" in err_str or "does not exist or you do not have access to it" in err_str:
                print("[ModelFallback] Configured Groq model not accessible. Auto-falling back to llama-3.1-8b-instant...")
                fallback_llm = get_llm(model="llama-3.1-8b-instant")
                chain = unified_prompt | fallback_llm | StrOutputParser()
                raw_response = invoke_with_retry(chain, {"text": transcript})
            else:
                raise
        data = parse_json_response(raw_response)
        
        title = (data.get("title") or "Meeting Intelligence Summary").strip()
        summary_text = (data.get("summary") or "").strip()
        action_items = (data.get("action_items") or "No action items found.").strip()
        key_decisions = (data.get("key_decisions") or "No key decisions found.").strip()
        questions = (data.get("questions") or "No open questions found.").strip()
        raw_mindmap = (data.get("mindmap") or "").strip()
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
    except Exception as exc:
        # Fallback to sequential individual extractors with retry
        from core.summarize import summarize, generate_title
        from core.extractor import (
            extract_actionable_items,
            extract_key_decisions,
            extract_questions,
            extract_mindmap,
        )
        title = invoke_with_retry(generate_title, transcript)
        summary_text = invoke_with_retry(summarize, transcript)
        action_items = invoke_with_retry(extract_actionable_items, transcript)
        key_decisions = invoke_with_retry(extract_key_decisions, transcript)
        questions = invoke_with_retry(extract_questions, transcript)
        raw_mindmap = invoke_with_retry(extract_mindmap, summary_text)
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

def ask_job_question_with_sources(rag_chain: Any, question: str, collection_name: Optional[str] = None) -> tuple[str, list[str]]:
    """
    Query the RAG chain and extract authentic retrieved source snippets.
    """
    from core.rag_engine import ask_question
    answer = ask_question(rag_chain, question)
    sources = []
    retriever = getattr(rag_chain, "retriever", None)
    if not retriever and collection_name:
        try:
            from core.vector_store import load_vector_store, get_retriever
            vs = load_vector_store(collection_name=collection_name)
            retriever = get_retriever(vs)
        except Exception:
            pass
    if retriever:
        try:
            docs = retriever.invoke(question)
            for doc in docs:
                content = getattr(doc, "page_content", None)
                if content and isinstance(content, str):
                    clean_content = content.strip()
                    if clean_content and clean_content not in sources:
                        sources.append(clean_content)
        except Exception as e:
            print(f"Notice: Source snippet extraction non-fatal error: {e}")
    return answer, sources

def delete_job_vectors(collection_name: str) -> bool:
    """
    Delete a specific ChromaDB vector collection.
    """
    from core.vector_store import delete_vector_store
    return delete_vector_store(collection_name=collection_name)

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
