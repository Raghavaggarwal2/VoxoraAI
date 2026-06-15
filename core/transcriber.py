import os
from groq import Groq

# Use the full 'whisper-large-v3' model instead of turbo. 
# Turbo is highly compressed and struggles with Hindi, while the full v3 model is state-of-the-art for multilingual audio.
WHISPER_MODEL = "whisper-large-v3"

def get_client():
    # Instantiate a fresh client each time so it always uses the latest API key from the Streamlit session
    return Groq(api_key=os.environ.get("GROQ_API_KEY"))

def transcribe_chunk(chunk_path: str, translate: bool = False, language: str = None) -> str:
    client = get_client()
    
    kwargs = {
        "model": WHISPER_MODEL,
    }
    # If a specific language is provided (e.g. 'hi' for Hindi), force the model to use it.
    if language and language.lower() != "auto":
        kwargs["language"] = language

    with open(chunk_path, "rb") as file:
        kwargs["file"] = (chunk_path, file.read())
        
        if translate:
            result = client.audio.translations.create(**kwargs)
        else:
            result = client.audio.transcriptions.create(**kwargs)
            
    return result.text

# helps to stop chunking if error comes in particular chunk therby making easy to detect which chunk is causing the issue.
def transcribe_all(chunks: list, translate: bool = False, language: str = None) -> str:
    full_transcript = ""
    
    for i, chunk in enumerate(chunks):
        print(f"Transcribing chunk {i+1}/{len(chunks)}: {chunk}")
        transcript = transcribe_chunk(chunk, translate=translate, language=language)
        full_transcript += transcript + " "
    
    print("All chunks transcribed.")
    return full_transcript.strip()  