import os
from groq import Groq

WHISPER_MODEL = "whisper-large-v3"

def get_client():
    return Groq(api_key=os.environ.get("GROQ_API_KEY"))

def transcribe_chunk(chunk_path: str, translate: bool = False, language: str = None) -> str:
    client = get_client()
    
    kwargs = {
        "model": WHISPER_MODEL,
    }
    if language and language.lower() != "auto":
        kwargs["language"] = language

    with open(chunk_path, "rb") as file:
        kwargs["file"] = (chunk_path, file.read())
        
        if translate:
            result = client.audio.translations.create(**kwargs)
        else:
            result = client.audio.transcriptions.create(**kwargs)
            
    return result.text

def transcribe_all(chunks: list, translate: bool = False, language: str = None) -> str:
    full_transcript = ""
    
    for i, chunk in enumerate(chunks):
        print(f"Transcribing chunk {i+1}/{len(chunks)}: {chunk}")
        transcript = transcribe_chunk(chunk, translate=translate, language=language)
        full_transcript += transcript + " "
    
    print("All chunks transcribed.")
    return full_transcript.strip()  