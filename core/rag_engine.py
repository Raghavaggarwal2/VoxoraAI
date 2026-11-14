import os
from dotenv import load_dotenv

load_dotenv()

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from core.vector_store import build_vector_store, load_vector_store, get_retriever

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

def format_docs(docs):
    return "\n\n".join([doc.page_content for doc in docs])

def build_rag_chain(transcript: str, collection_name: str = "meeting_transcript"):
    vector_store = build_vector_store(transcript, collection_name=collection_name)
    retriever = get_retriever(vector_store)
    llm = get_llm()

    prompt = ChatPromptTemplate.from_messages(

        [(
            "system",
            """You are an expert meeting assistant. Answer the user's question 
        based ONLY on the meeting transcript context provided below.

        If the answer is not found in the context, say: 
        "I could not find this information in the meeting transcript."

        Always be concise and precise. If quoting someone, mention it clearly.

        Context from meeting transcript:
        {context}""",
        ),
        ("human", "{question}"),
    ]
    )

    rag_chain = (
        {"context": retriever | RunnableLambda(format_docs), "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return rag_chain

def load_rag_chain(collection_name: str = "meeting_transcript"):
    vector_store = load_vector_store(collection_name=collection_name)
    retriever = get_retriever(vector_store)
    
    llm = get_llm()
    
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are an expert meeting assistant. Answer the user's question 
based ONLY on the meeting transcript context provided below.

If the answer is not found in the context, say: 
"I could not find this information in the meeting transcript."

Always be concise and precise. If quoting someone, mention it clearly.

Context from meeting transcript:
{context}""",
        ),
        ("human", "{question}"),
    ])

    rag_chain = (
        {
            "context":  retriever| RunnableLambda(format_docs),
            "question": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )
    return rag_chain


def ask_question(rag_chain, question:str) -> str:
    print(f"Question : {question}")
    answer = invoke_with_retry(rag_chain, question)
    print(f"answer :{answer}")
    return answer
    