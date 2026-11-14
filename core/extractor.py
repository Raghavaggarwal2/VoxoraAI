# Actionable items, decisions, questions

import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter

from utils.retry_handler import invoke_with_retry, normalize_groq_model

def get_llm(model: str = None):
    # Account 2 (LLM): GROQ_LLM_API_KEY, GROQ_API_KEY_2, or fallback to GROQ_API_KEY
    api_key = (
        os.getenv("GROQ_LLM_API_KEY")
        or os.getenv("GROQ_API_KEY_2")
        or os.getenv("GROQ_API_KEY")
    )
    raw_model = model or os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    selected_model = normalize_groq_model(raw_model)
    return ChatGroq(
        model=selected_model,
        groq_api_key=api_key,
        temperature=0.1,
    )

def split_transcript(transcript: str) -> list[str]:
    # Gemini 1.5 Flash has a 1M token context window. Chunking at 3000 chars forced
    # dozens of sequential API calls that triggered rate limits and high latency.
    # We use 50,000 chars (~12,000 tokens) chunk size so standard meetings process in 1 call,
    # while retaining map-reduce chunking for exceptionally long transcripts.
    splitter = RecursiveCharacterTextSplitter(chunk_size=50000, chunk_overlap=1000)
    return splitter.split_text(transcript)


def build_chunked_extractor(
    item_prompt: str,
    merge_prompt: str,
) -> callable:
    llm = get_llm()
    item_chain = ChatPromptTemplate.from_messages(
        [
            ("system", item_prompt),
            ("human", "{text}"),
        ]
    ) | llm | StrOutputParser()

    merge_chain = ChatPromptTemplate.from_messages(
        [
            ("system", merge_prompt),
            ("human", "{text}"),
        ]
    ) | llm | StrOutputParser()

    def extract(transcript: str) -> str:
        chunks = split_transcript(transcript)

        if not chunks:
            chunks = [transcript]

        if len(chunks) == 1:
            return invoke_with_retry(item_chain, {"text": chunks[0]})

        chunk_outputs = [invoke_with_retry(item_chain, {"text": chunk}) for chunk in chunks]
        combined_output = "\n\n".join(chunk_outputs)

        return invoke_with_retry(merge_chain, {"text": combined_output})

    return extract


def extract_actionable_items(transcript: str) -> str:
    return build_chunked_extractor(
        "You are an expert meeting analyst. Read the following meeting transcript chunk and extract ONLY the actionable tasks or action items mentioned. For each item provide:\n"
        "- Task description\n"
        "- Owner (who is responsible)\n"
        "- Deadline (if mentioned, else write 'Not specified')\n\n"
        "Format as a clean markdown numbered list. If none are found, exactly reply with 'No action items found.'",
        "You are an expert meeting analyst. Merge these partial action-item lists into one comprehensive, final numbered list. Remove any duplicates, maintain clear wording, and preserve owners/deadlines. Do not include conversational filler. If the combined text contains no actionable items, exactly reply with 'No action items found.'",
    )(transcript)


def extract_key_decisions(transcript: str) -> str:
    return build_chunked_extractor(
        "You are an expert meeting analyst. From the meeting transcript chunk, extract only the key decisions made in that chunk. Format as a clean markdown numbered list. If none are found, exactly reply with 'No key decisions found.'",
        "You are an expert meeting analyst. Merge these partial decision lists into one comprehensive, final numbered list. Remove duplicates, keep the clearest wording, and if nothing decisive appears in the combined text, exactly reply with 'No key decisions found.'",
    )(transcript)


def extract_questions(transcript: str) -> str:
    return build_chunked_extractor(
        "From the meeting transcript chunk, extract all unresolved questions or topics needing follow-up that appear in that chunk. Format as a numbered list. If none found say 'No open questions found.'",
        "You are an expert meeting analyst. Merge these partial question lists into one final numbered list. Remove duplicates, keep the clearest wording, and return 'No open questions found.' if nothing still needs follow-up in the combined text.",
    )(transcript)

def extract_mindmap(transcript: str) -> str:
    raw = build_chunked_extractor(
        "You are an expert meeting analyst. Extract the main topics and subtopics from this meeting chunk and format them as a Mermaid.js 'mindmap'. Keep the mindmap extremely concise and highly summarized. Only include top-level main topics and crucial subtopics (limit depth to 2-3 levels). Nodes must be short phrases (1-4 words), not sentences or detailed points. Provide only a high-level glimpse. CRITICAL: You MUST wrap EVERY node text in double quotes to prevent syntax errors (e.g., `\"My Topic\"`). Never use unquoted text for nodes. Return ONLY the raw Mermaid code block and absolutely no other text.",
        "You are an expert meeting analyst. Combine these partial Mermaid mindmaps into one single, highly concise Mermaid mindmap representing the whole meeting. Aggressively summarize: keep only the most important top-level topics and crucial subtopics (limit depth to 2-3 levels). Nodes must be short phrases (1-4 words max). Do not include detailed points, provide only a brief high-level glimpse. CRITICAL: You MUST wrap EVERY node text in double quotes to prevent syntax errors (e.g., `\"Key Decision\"`). Never use unquoted text for nodes. Return ONLY the raw Mermaid code block and absolutely no other text.",
    )(transcript)
    
    cleaned = raw.replace("```mermaid", "").replace("```", "").strip()
    
    return f"```mermaid\n{cleaned}\n```"

