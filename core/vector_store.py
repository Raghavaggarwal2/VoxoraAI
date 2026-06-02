import os 
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

CHROMA_DIR = "vector_db"
COLLECTION_NAME = "meeting_transcript"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

def get_embeddings():
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL, model_kwargs={"device": "cpu"})

def build_vector_store(transcript: str) -> Chroma:
    print("Building vector store...")
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_text(transcript)
    
    docs = [Document(page_content=chunk, metadata={"source": f"chunk_{i}"}) for i, chunk in enumerate(chunks)]
    embeddings = get_embeddings()
    vector_store = Chroma.from_documents(documents=docs, collection_name=COLLECTION_NAME, embedding=embeddings, persist_directory=CHROMA_DIR)
    
    return vector_store

def load_vector_store() -> Chroma:
    if not os.path.exists(os.path.join(CHROMA_DIR, COLLECTION_NAME)):
        raise ValueError("Vector store not found. Please build it first.")
    
    embeddings = get_embeddings()
    vector_store = Chroma(collection_name=COLLECTION_NAME, embedding=embeddings, persist_directory=CHROMA_DIR)
    
    return vector_store

def get_retriever(vector_store: Chroma, k: int = 4):
    return vector_store.as_retriever(search_type="similarity", search_kwargs={"k": k})