import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

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
        temperature=0.3,
    )

def split_transcript(transcript: str) -> list:
    # Gemini 1.5 Flash has a 1M token context window. Chunking at 3000 chars forced
    # dozens of sequential API calls that triggered rate limits and high latency.
    # We use 50,000 chars (~12,000 tokens) chunk size so standard meetings process in 1 call,
    # while retaining map-reduce chunking for exceptionally long transcripts.
    splitter = RecursiveCharacterTextSplitter(chunk_size=50000, chunk_overlap=1000)
    return splitter.split_text(transcript)

def summarize(transcript: str) -> str:
    llm = get_llm()
    chunks = split_transcript(transcript)
    if not chunks:
        return ""
    
    combined_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are an expert meeting summarizer. Combine and write a highly detailed, well-structured professional meeting summary. Use markdown formatting with bold subheadings and detailed bullet points for each major topic discussed. Ensure the summary is comprehensive and captures the true depth of the conversation. DO NOT include sections for Action Items, Key Decisions, Open Questions, or Key Takeaways."), 
            ("human", "{text}")
        ]
    )

    # Fast path: Single call for transcripts within context limits
    if len(chunks) == 1:
        single_chain = combined_prompt | llm | StrOutputParser()
        return invoke_with_retry(single_chain, {"text": chunks[0]})
    
    map_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert meeting analyst. Write a detailed, comprehensive summary of this portion of the transcript. Capture the nuances, context, main arguments, and general flow of the conversation. DO NOT list or extract specific action items, key decisions, open questions, or key takeaways, as they will be extracted separately."),
        ("human", "{text}")
    ])
    
    map_chain = map_prompt | llm | StrOutputParser()
    chunk_summaries = [invoke_with_retry(map_chain, {"text": chunk}) for chunk in chunks]
    combined = "\n\n".join(chunk_summaries)
    
    combined_chain = (
        RunnablePassthrough() | RunnableLambda(lambda x: {"text": x}) | combined_prompt | llm | StrOutputParser()
    )
    
    return invoke_with_retry(combined_chain, combined)

def generate_title(transcript: str) -> str:
    llm = get_llm()
    
    title_chain = (
        RunnablePassthrough() | RunnableLambda(lambda x: {"text": x}) | ChatPromptTemplate.from_messages(
            [
                ("system", "You are an expert meeting summarizer. Generate a catchy, descriptive, and highly professional title (max 6-8 words) that captures the core essence of this meeting transcript. Return ONLY the title with no quotes or extra text."),
                ("human", "{text}")
            ]) | llm | StrOutputParser()
            
    )
    
    return invoke_with_retry(title_chain, transcript[:2000])