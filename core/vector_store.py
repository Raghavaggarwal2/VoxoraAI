import os 
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

CHROMA_DIR = "vector_db"
COLLECTION_NAME = "meeting_transcript"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

_cached_embeddings = None

def get_embeddings():
    global _cached_embeddings
    if _cached_embeddings is None:
        _cached_embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL, model_kwargs={"device": "cpu"})
    return _cached_embeddings

def build_vector_store(transcript: str, collection_name: str = COLLECTION_NAME, persist_directory: str = CHROMA_DIR) -> Chroma:
    print(f"Building vector store for collection '{collection_name}'...")
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_text(transcript)
    
    docs = [Document(page_content=chunk, metadata={"source": f"chunk_{i}"}) for i, chunk in enumerate(chunks)]
    embeddings = get_embeddings()
    vector_store = Chroma.from_documents(documents=docs, collection_name=collection_name, embedding=embeddings, persist_directory=persist_directory)
    
    return vector_store

def load_vector_store(collection_name: str = COLLECTION_NAME, persist_directory: str = CHROMA_DIR) -> Chroma:
    embeddings = get_embeddings()
    vector_store = Chroma(collection_name=collection_name, embedding_function=embeddings, persist_directory=persist_directory)
    
    return vector_store

def get_retriever(vector_store: Chroma, k: int = 6):
    return vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={"k": k, "fetch_k": max(15, k * 2), "lambda_mult": 0.7}
    )

def delete_vector_store(collection_name: str = COLLECTION_NAME, persist_directory: str = CHROMA_DIR) -> bool:
    """
    Safely delete a specific vector store collection from persistent ChromaDB.
    """
    try:
        import chromadb
        client = chromadb.PersistentClient(path=persist_directory)
        existing = [c.name for c in client.list_collections()]
        if collection_name in existing:
            client.delete_collection(name=collection_name)
            print(f"Deleted vector collection '{collection_name}'")
            return True
        return False
    except Exception as e:
        print(f"Note: Could not delete vector collection '{collection_name}': {e}")
        return False
