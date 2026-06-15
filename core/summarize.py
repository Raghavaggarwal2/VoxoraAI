from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

import os

def get_llm():
    return ChatMistralAI(model='mistral-medium-latest', mistral_api_key=os.getenv("MISTRALAI_API_KEY"), temperature=0.3)

def split_transcript(transcript: str) -> list:
    splitter = RecursiveCharacterTextSplitter(chunk_size=3000, chunk_overlap=200)
    
    return splitter.split_text(transcript)

def summarize(transcript: str) -> str:
    llm = get_llm()
    
    map_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert meeting analyst. Write a detailed, comprehensive summary of this portion of the transcript. Capture the nuances, context, main arguments, and general flow of the conversation. DO NOT list or extract specific action items, key decisions, open questions, or key takeaways, as they will be extracted separately."),
        ("human", "{text}")
    ])
    
    map_chain = map_prompt | llm | StrOutputParser()
    
    chunks = split_transcript(transcript)
    
    chunk_summaries = [map_chain.invoke({"text": chunk}) for chunk in chunks]
    
    combined = "\n\n".join(chunk_summaries)
    
    combined_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are an expert meeting summarizer. Combine these partial summaries into one highly detailed, well-structured professional meeting summary. Use markdown formatting with bold subheadings and detailed bullet points for each major topic discussed. Ensure the summary is comprehensive and captures the true depth of the conversation. DO NOT include sections for Action Items, Key Decisions, Open Questions, or Key Takeaways."), 
            ("human", "{text}")
        ]
        
    )
    
    combined_chain = (
        RunnablePassthrough() | RunnableLambda(lambda x: {"text": x}) | combined_prompt | llm |StrOutputParser()
    )
    
    return combined_chain.invoke(combined)

def generate_title(transcript: str) -> str:
    llm = get_llm()
    
    title_chain = (
        RunnablePassthrough() | RunnableLambda(lambda x: {"text": x}) | ChatPromptTemplate.from_messages(
            [
                ("system", "You are an expert meeting summarizer. Generate a catchy, descriptive, and highly professional title (max 6-8 words) that captures the core essence of this meeting transcript. Return ONLY the title with no quotes or extra text."),
                ("human", "{text}")
            ]) | llm | StrOutputParser()
            
    )
    
    return title_chain.invoke(transcript[:2000])