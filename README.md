# Voxora AI 🎬

Turn any video or audio file into structured intelligence. **Voxora AI** is a Streamlit-based web application that transcribes videos, analyzes their content, and generates interactive knowledge tools like summaries, visual mind maps, and a RAG-powered chatbot. 

## Features

- **Multiple Input Sources**: Input a YouTube URL or upload a local audio/video file directly (`mp4`, `mp3`, `wav`, `m4a`, `webm`, `mkv`, `mov`).
- **High-Speed Transcription**: Leverages **Groq Cloud's** `whisper-large-v3` API for lightning-fast and accurate audio transcription.
- **Advanced AI Analysis**: Uses **MistralAI** language models to automatically extract structured data from your video:
  - 📝 **Executive Summary**
  - ✅ **Actionable Items** (including Owners and Deadlines)
  - 🔑 **Key Decisions**
  - ❓ **Open Questions**
- **Visual Mind Map**: Automatically generates a high-level, summarized flowchart using Mermaid.js visually rendered directly inside the browser.
- **Interactive RAG Chat**: Chat with your video! The app builds an in-memory knowledge base (using ChromaDB and Sentence Transformers) so you can ask context-aware questions about the transcript.
- **Raw Transcript Export**: Download the fully generated transcript as a plain text file.

## Architecture & Tech Stack

- **Frontend**: [Streamlit](https://streamlit.io/) (Wide layout with custom UI CSS styling)
- **LLM Orchestration**: [LangChain](https://www.langchain.com/) (Recursive text splitters, RAG chains, custom prompt chunking)
- **APIs**: 
  - **Groq** (Audio transcription)
  - **Mistral AI** (Text summarization, extraction, answering)
- **Local Embeddings**: HuggingFace Sentence Transformers (via `langchain_huggingface`)
- **Vector Store**: [ChromaDB](https://www.trychroma.com/) (Ephemeral knowledge base)
- **Media Processing**: `yt-dlp` (YouTube downloading), `pydub`, and `ffmpeg-python` (Audio chunk processing)

## Getting Started

### Prerequisites

You must have **FFmpeg** installed on your system and accessible in your system's PATH, as it is required for `pydub` to process audio files.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Voxora-AI.git
   cd Voxora-AI
   ```

2. **Install the dependencies:**
   It is recommended to use a virtual environment.
   ```bash
   pip install -r requirements.txt
   ```

### Running the App

1. Start the Streamlit server:
   ```bash
   streamlit run app.py
   ```

2. Open the provided Local URL in your browser (usually `http://localhost:8501`).

3. **Configure API Keys**: 
   - Open the sidebar inside the app.
   - Enter your **Groq API Key** (for Whisper transcription).
   - Enter your **MistralAI API Key** (for data extraction and chat).
   - *Note: Keys are stored only in memory for the current session and never persisted to disk.*

4. **Analyze!**
   Select your source (YouTube URL or Local file), choose the language (Auto-Detect supported), and hit **Analyze Video**.

## Security & Privacy
API keys are handled securely via the Streamlit UI session state and are injected into the environment strictly during runtime. No keys are hardcoded or saved locally between sessions.
