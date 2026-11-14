import os

# Set default Google GenAI API version to v1beta for Gemini 1.5/2.0 Flash support
os.environ.setdefault("GOOGLE_GENAI_API_VERSION", "v1beta")
from utils.audio_processor import process_input
from core.transcriber import transcribe_all
from core.summarize import summarize, generate_title
from core.extractor import extract_actionable_items, extract_key_decisions, extract_questions
from core.rag_engine import build_rag_chain, ask_question

def run_pipeline(source: str) -> dict:
    print("Starting AI Video Assistant")
    
    chunks = process_input(source)
    
    transcript = transcribe_all(chunks)
    print("Raw Transcript:", transcript[:500], "...")
    
    title = generate_title(transcript)
    
    summary = summarize(transcript)
    
    action_items = extract_actionable_items(transcript)
    key_decisions = extract_key_decisions(transcript)
    questions = extract_questions(transcript)
    
    rag_chain = build_rag_chain(transcript)
    
    return {
        "title": title,
        "summary": summary,
        "action_items": action_items,
        "key_decisions": key_decisions,
        "questions": questions,
        "rag_chain": rag_chain
    }

def main():
    print("Hello from ai-video-assistant!")


if __name__ == "__main__":
    main()
    
    # Prompt for Groq API keys if not in environment
    if not os.environ.get("GROQ_API_KEY") and not os.environ.get("GROQ_WHISPER_API_KEY"):
        whisper_k = input("Enter Groq Account 1 API Key (Whisper transcription): ").strip()
        os.environ["GROQ_API_KEY"] = whisper_k
        os.environ["GROQ_WHISPER_API_KEY"] = whisper_k
    if not os.environ.get("GROQ_LLM_API_KEY") and not os.environ.get("GROQ_API_KEY_2"):
        llm_k = input("Enter Groq Account 2 API Key (LLM Intelligence, press Enter to reuse Account 1): ").strip()
        if llm_k:
            os.environ["GROQ_LLM_API_KEY"] = llm_k
            os.environ["GROQ_API_KEY_2"] = llm_k
        else:
            os.environ["GROQ_LLM_API_KEY"] = os.environ.get("GROQ_API_KEY", "")

    # CLI entry point
    source = input("Enter YouTube URL or local file path: ").strip()
    result = run_pipeline(source)

    print("\n" + "=" * 60)
    print(f"📌 Title: {result['title']}")
    print(f"\n📋 Summary:\n{result['summary']}")
    print(f"\n✅ Action Items:\n{result['action_items']}")
    print(f"\n🔑 Key Decisions:\n{result['key_decisions']}")
    print(f"\n❓ Open Questions:\n{result['questions']}")
    print("=" * 60)

    # Phase 2 — Chat with your meeting via RAG
    print("\n💬 Chat with your meeting (type 'exit' to quit)\n")
    rag_chain = result["rag_chain"]
    while True:
        question = input("You: ").strip()
        if question.lower() in ["exit", "quit", "q"]:
            print("👋 Goodbye!")
            break
        if not question:
            continue
        answer = ask_question(rag_chain, question)
        print(f"\n🤖 Assistant: {answer}\n")
