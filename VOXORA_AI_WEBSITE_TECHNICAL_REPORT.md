# Voxora AI — Website Platform Technical Dossier & Report Source

> **Document Purpose**: This comprehensive dossier provides an exhaustive, 100% accurate technical and functional description of the **Voxora AI Web Application** (React 18 frontend + FastAPI backend). It is designed to be fed into any LLM (e.g. Gemini, Claude, GPT) to generate polished project reports, technical documentation, whitepapers, or portfolio case studies without hallucination or missed functionality.

---

## 1. Executive Summary & Product Vision

### 1.1 What is Voxora AI?
**Voxora AI** is a production-grade, privacy-first web application that transforms unstructured video and audio recordings (meetings, lectures, technical presentations, interviews) into structured, queryable executive intelligence.

Users upload local video or audio files directly through a modern web interface. The system resamples and extracts audio via **FFmpeg**, transcribes it at high speed using Groq Cloud's **Whisper Large v3**, extracts structured intelligence using **openai/gpt-oss-20b**, renders interactive **Mermaid.js** mind maps, and indexes the content into an isolated **ChromaDB** vector store for grounded, citation-backed **Retrieval-Augmented Generation (RAG)** chat.

### 1.2 Core Value Propositions
- **Ultra-Fast Processing**: Generates full transcriptions and multi-layer executive analysis in 10–25 seconds for a 10–15 minute recording.
- **Client-Side Privacy (Zero-Knowledge Local Workspaces)**: Supports end-to-end client-side encryption via Web Crypto API (AES-GCM-256) and the browser's Origin Private File System (OPFS).
- **100% Grounded Intelligence**: RAG engine enforces strict anti-hallucination constraints—answering questions using only authentic transcript chunks with source citations and declining out-of-scope queries.
- **Zero Cloud Storage Lock-in**: All vector stores, SQLite job stores, and media chunks are managed locally/on-premise with automatic cleanup.

---

## 2. System Architecture & Tech Stack

```mermaid
flowchart TD
    subgraph Client["React 18 Frontend (Port 5173)"]
        UI[Upload & Intelligence Dashboard]
        DexieDB[(Client IndexedDB / Dexie.js)]
        OPFS[(Browser Origin Private File System)]
        WebCrypto[Web Crypto API AES-GCM-256]
        UI <--> DexieDB
        UI <--> OPFS
        UI <--> WebCrypto
    end

    subgraph Backend["FastAPI Backend (Port 8000)"]
        Router["API Gateway /api/jobs"]
        JobManager[Async ThreadPool Job Manager]
        JobStore[(Persistent SQLite data/jobs.sqlite3)]
        Router --> JobManager
        JobManager --> JobStore
    end

    subgraph AudioEngine["Media Processing Subsystem"]
        FFprobe[ffprobe Audio Stream Inspection]
        FFmpeg[FFmpeg 16kHz Mono WAV Extraction]
        Chunker[Audio Chunker 5-min segments]
        FFprobe --> FFmpeg --> Chunker
    end

    subgraph AICloud["Groq Cloud Dual-Account Infrastructure"]
        Account1["Account 1: whisper-large-v3 (Speech-to-Text)"]
        Account2["Account 2: openai/gpt-oss-20b (Reasoning & RAG)"]
    end

    subgraph VectorEngine["Vector Store & Retrieval"]
        Chroma[(Session-Scoped ChromaDB vector_db/)]
        HFModel[Cached all-MiniLM-L6-v2 Embeddings]
        MMR[Maximal Marginal Relevance Retriever k=6]
        HFModel --> Chroma
        Chroma --> MMR
    end

    UI -->|Multipart File Upload| Router
    JobManager --> AudioEngine
    Chunker -->|WAV Chunks| Account1
    Account1 -->|Raw Transcript| Account2
    Account1 -->|Transcript Text| ChunkerText[Text Splitter 1000/200]
    ChunkerText --> HFModel
    Account2 -->|JSON: Title, Summary, Actions, Decisions, Mindmap| JobStore
    UI -->|Real-time Polling 1.0s| Router
    UI -->|Ask RAG Question| Router
    Router --> MMR --> Account2 -->|Grounded Answer + Citations| UI
```

### 2.1 Technology Specifications

| Layer | Component | Version / Library | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React 18 | Vite 6, ES6+ JavaScript | Modern SPA, fast HMR, component modularity |
| **Styling & UI** | Tailwind CSS 3 | Lucide React | Clean "Coastal Modern" SaaS theme (Light/Dark) |
| **Client Database** | Dexie.js | IndexedDB Wrapper | Persistent local storage for workspace metadata |
| **Client File Storage** | OPFS | Origin Private File System | High-performance, sandboxed local media playback |
| **Client Encryption** | Web Crypto API | AES-GCM 256-bit + PBKDF2 | Zero-knowledge client-side workspace locking |
| **Diagram Engine** | Mermaid.js | v11 Core | Interactive mind map rendering (zoom, pan, SVG) |
| **Backend Framework** | FastAPI | Python 3.10+, Uvicorn | Async REST API, Pydantic v2 validation |
| **Job Execution** | ThreadPoolExecutor | Max 2 Concurrent Workers | Non-blocking background media processing |
| **Server Persistence** | SQLite | Python `sqlite3` (`data/jobs.sqlite3`) | Survives server reboots without watcher restarts |
| **Speech-to-Text** | Groq Whisper | `whisper-large-v3` | 16kHz mono audio transcription |
| **LLM Reasoning** | Groq Cloud | `openai/gpt-oss-20b` | Structured JSON extraction & RAG reasoning |
| **Vector Database** | ChromaDB | LangChain Chroma (`vector_db/`) | Session-isolated semantic vector collections |
| **Embeddings** | HuggingFace | `all-MiniLM-L6-v2` | 384-dimensional dense semantic embeddings |
| **Audio/Video Tools** | FFmpeg & ffprobe | Native binaries (C:\ffmpeg\bin) | Direct WAV resampling & stream inspection |

---

## 3. Detailed Website User Flow & Features

### 3.1 Screen 1: Landing Page (`/`)
- **Brand Identity**: Coastal modern aesthetic with high-contrast typography and subtle badges.
- **Hero & Value Pillars**: Highlighting audio extraction, Groq Whisper STT, GPT-OSS reasoning, and interactive Mermaid diagrams.
- **Live System Status**: Real-time status indicator showing backend connection health (`HTTP 200 /api/health`).
- **Direct Drag-and-Drop Uploader**: Enables immediate file upload without requiring login or workspace setup.

### 3.2 Screen 2: Workspace Management & Privacy (`/workspaces`)
- **Local-First Architecture**: Workspaces exist on the client's device in IndexedDB (`Dexie.js`), never uploaded to third-party databases.
- **Client-Side Encryption**: Optional password protection using Web Crypto API (`AES-GCM-256` derived via `PBKDF2` with 100,000 iterations). 
- **Recovery Phrase**: Generates a 12-word cryptographic recovery phrase for password resets without central authority recovery.
- **Private Media Playback**: Media files are stored directly in browser OPFS, enabling full video/audio playback directly inside the browser.

### 3.3 Screen 3: New Analysis Ingestion (`/new-analysis`)
- **Supported Formats**: `mp4`, `mov`, `mkv`, `webm`, `mp3`, `wav`, `m4a`, `aac`, `ogg` (up to 200MB).
- **Pre-flight Stream Validation**: `ffprobe` validates that the uploaded file has a decodable audio track. Video-only DASH files or silent recordings are rejected upfront with helpful user tips instead of crashing.
- **Language Selection**: Auto-detect, English, Hindi, Spanish, French, German, Japanese.
- **Analysis Depth**: Standard, Deep Dive, or Executive Brief.
- **Privacy Disclosure Modal**: Requires user confirmation before transmitting audio bytes to Groq Cloud for processing.

### 3.4 Screen 4: Real-Time Live Processing Stepper (`/workspace/:id`)
- **Responsive 1.0s Polling**: Continuously polls `GET /api/jobs/{id}` for live status updates.
- **5-Stage Pipeline Progress**:
  1. `preparing_audio` (15%): Resampling to 16kHz mono WAV, splitting into 5-minute chunks.
  2. `transcribing` (40%): Concurrent Groq Whisper transcription with language detection.
  3. `analyzing` (70%): Groq GPT-OSS-20B single-pass structured JSON analysis.
  4. `indexing` (90%): 1,000-char text splitting, embedding generation, ChromaDB vector indexing.
  5. `completed` (100%): Automatic transition to the Analysis Workspace without requiring a page refresh.
- **Graceful Error Handling**: Specific error cards for `NO_AUDIO_STREAM`, `EMPTY_AUDIO`, and `SERVER_RESTARTED` with "Try Another Analysis" and "Re-analyze Local Media" buttons.

### 3.5 Screen 5: The Intelligence Workspace (5 Structured Tabs)
- **Header & Metrics**: Displays meeting title, completed badge, "Encrypted Locally" pill, total word count, and a 1-click **"Download Transcript (.txt)"** button.
- **Integrated Video/Audio Player**: Collapsible media player streaming directly from private browser OPFS.
- **Tab 1: Executive Summary**: In-depth, multi-paragraph markdown briefing organized into bold thematic subheadings.
- **Tab 2: Action Items**: Numbered list of actionable tasks containing Description, Assigned Owner, and Deadline.
- **Tab 3: Key Decisions**: Distinct bulleted list of final conclusions and strategic choices agreed upon.
- **Tab 4: Open Questions**: Numbered list of unanswered questions, blockers, or topics requiring follow-up.
- **Tab 5: Interactive Mermaid Mind Map**:
  - Dynamically rendered hierarchical tree generated by the LLM.
  - Interactive SVG canvas with Zoom In, Zoom Out, Pan, and Reset controls.
  - Fullscreen modal mode and **"Download SVG"** button for slide decks and reports.
- **RAG Chat Panel (Sidebar / Split Screen)**:
  - Natural-language Q&A powered by ChromaDB and `openai/gpt-oss-20b`.
  - **Source Snippet Citations**: Every answer displays the exact transcript excerpts used to generate the response.
  - **Anti-Hallucination Guardrail**: Explicitly responds with *"I could not find this information in the meeting transcript"* if an answer is absent from the context.

### 3.6 Screen 6: History & Library (`/history`)
- Searchable library of all previously analyzed meetings stored locally in Dexie.
- Filter by media type, title, or date.
- Instant opening of past transcripts, mind maps, and cached encrypted analyses.

---

## 4. Deep Dive: The Optimized RAG Architecture

The RAG pipeline implemented in `core/` and exposed via FastAPI is optimized for maximum context recall, precision, and low latency:

### 4.1 Pipeline Specifications
- **Chunking Strategy**: `RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)`.
  - *Rationale*: Short 500-char chunks cut off multi-word proper nouns, research frameworks (e.g. CoALA / Princeton), and compound sentences. A 1,000-char chunk with 200-char overlap preserves semantic continuity while fitting cleanly within context.
- **Retrieval Algorithm**: **Maximal Marginal Relevance (MMR)** (`k=6`, `fetch_k=15`, `lambda_mult=0.7`).
  - *Rationale*: Naive cosine similarity returns near-identical sentences from the same 30 seconds of a video. MMR balances similarity with diversity, retrieving distinct insights spanning ~60% of an 11-minute transcript.
- **Embedding Model & Singleton Cache**: HuggingFace `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions) loaded into RAM as a singleton. Eliminates 5+ seconds of PyTorch reload overhead on every query.

### 4.2 Verified Benchmark Scorecard (11-Minute Technical Video)
Tested against a real technical lecture (*"The Four Types of Memory Every AI Agent Needs"*, 1,477 words, 8,412 chars):

| Metric | Result | Industry Standard | Status |
| :--- | :---: | :---: | :---: |
| **Overall Accuracy / Faithfulness** | **100.0%** (10/10) | 70% – 85% | **Exceeds** |
| **Retrieval Relevance Hit Rate** | **100.0%** (10/10) | 75% – 85% | **Exceeds** |
| **Anti-Hallucination Trap Defense** | **100.0%** (2/2) | 80% – 90% | **Perfect** |
| **Individual Query Latency** | **0.44s – 0.95s** | 2.5s – 6.0s | **Sub-second** |

---

## 5. Architectural Decisions & Scope Boundaries

### 5.1 Why YouTube URL Downloading is NOT in the Main Web App
While legacy prototype scripts (`app.py` / `main.py`) contained experimental YouTube URL fetching, the modern web application deliberately focuses exclusively on **direct local media upload**:
1. **Bot Detection & IP Blocking**: Cloud servers and automated clients face frequent `HTTP 403 Forbidden`, CAPTCHA challenges, or "Sign in to confirm you are not a bot" walls from YouTube.
2. **DASH Stream Separation**: YouTube delivers high-definition video and audio as separate unmultiplexed DASH streams. Web tools frequently capture silent video files without audio.
3. **Enterprise Privacy & Stability**: Direct file uploads ensure 100% upload success, zero dependency on scraping, and complete privacy for proprietary recordings.

### 5.2 Groq Dual-Account Isolation
To eliminate rate-limit collisions on Groq Cloud's free and developer tiers, the backend separates STT and LLM workloads:
- `GROQ_WHISPER_API_KEY`: Reserved strictly for audio transcription requests.
- `GROQ_LLM_API_KEY`: Dedicated to structured analysis and multi-turn conversational RAG.

### 5.3 Database Isolation (`data/jobs.sqlite3`)
The job metadata database is located at `data/jobs.sqlite3` rather than inside `backend/`. This prevents FastAPI hot-reload watchers (`uvicorn --reload`) from detecting database writes and prematurely terminating in-progress background jobs.

---

## 6. Complete API Endpoint Specification

### `POST /api/jobs/upload`
- **Description**: Upload a local media file and initiate background processing.
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: Binary audio/video file (up to 200MB).
  - `language`: Target language string (e.g. `'auto'`, `'en'`, `'hi'`).
- **Response** (`202 Accepted`):
  ```json
  {
    "job_id": "60037715-6bbc-402e-aa7e-6ac7432905bb",
    "status": "queued",
    "stage": "queued",
    "message": "Upload processing job created successfully",
    "source_attribution": "Groq Whisper (Local Media)"
  }
  ```

### `GET /api/jobs/{job_id}`
- **Description**: Poll live pipeline status, active stage, and progress percentage.
- **Response** (`200 OK`):
  ```json
  {
    "job_id": "60037715-6bbc-402e-aa7e-6ac7432905bb",
    "status": "processing",
    "stage": "analyzing",
    "progress_percent": 70,
    "status_message": "Generating summary, action items, decisions, and mind map...",
    "created_at": "2026-11-13T14:00:00Z",
    "completed_at": null,
    "error": null,
    "source_attribution": "Groq Whisper (Local Media)"
  }
  ```

### `GET /api/jobs/{job_id}/results`
- **Description**: Retrieve structured executive intelligence and Mermaid mind map syntax.
- **Response** (`200 OK`):
  ```json
  {
    "job_id": "60037715-6bbc-402e-aa7e-6ac7432905bb",
    "title": "Four Types of AI Agent Memory Architecture",
    "summary": "### Core Concepts\nDetailed markdown briefing...",
    "action_items": "1. Audit memory usage (Owner: Engineering, Deadline: Friday)\n...",
    "key_decisions": "1. Implement progressive disclosure for agent skills\n...",
    "questions": "1. When should old episodic memories be pruned?\n...",
    "mindmap": "mindmap\n  root((\"Agent Memory\"))\n    Working[\"Working Memory\"]\n    Semantic[\"Semantic Memory\"]\n    Procedural[\"Procedural Memory\"]\n    Episodic[\"Episodic Memory\"]",
    "source_attribution": "Groq Whisper (Local Media)"
  }
  ```

### `POST /api/jobs/{job_id}/chat`
- **Description**: Ask a natural-language question against the meeting transcript.
- **Request Body**:
  ```json
  {
    "question": "What analogy is used to describe working memory?"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "answer": "The speaker compares working memory to RAM (Random Access Memory), describing it as a fast, volatile scratch pad.",
    "sources": [
      "So it really kind of the scratch pad and the analogy everybody uses for this is this is just like RAM random access memory..."
    ]
  }
  ```

---

## 7. Instructions for Feeding into an LLM

To generate a complete, professional report from this dossier, copy this document into your target LLM (Gemini, Claude, GPT-4) with one of the following prompts:

### Prompt 1: Comprehensive Project Report (Academic / Enterprise)
```text
You are an expert Principal AI Software Architect. Based ONLY on the technical dossier provided above for "Voxora AI", write a comprehensive, professional Project Report. 

Structure the report with the following formal sections:
1. Executive Summary & Problem Statement
2. System Architecture & High-Level Design (Frontend, Backend, AI Infrastructure)
3. Media Ingestion & Pre-flight Validation Pipeline
4. High-Precision RAG Architecture & 11-Minute Benchmark Analysis
5. Client-Side Security, OPFS Storage & Zero-Knowledge Encryption
6. API Design & Data Contract Specifications
7. Production Readiness Assessment & Future Roadmap

Ensure you highlight the non-negotiable architectural decisions (e.g. why YouTube downloading was excluded from the main web app in favor of reliable local media, the dual-account Groq setup, and the 100% RAG benchmark score). Do not invent any unmentioned features.
```

### Prompt 2: Product Whitepaper / Case Study
```text
Act as a Senior AI Product Evangelist. Using the provided Voxora AI technical dossier, generate an engaging 5-page Product Whitepaper titled: "Voxora AI: Building a Sub-Second, Zero-Leakage Video Intelligence Platform with Groq and LangChain". Highlight the sub-second RAG latency, the Coastal modern user interface, the interactive Mermaid mind maps, and client-side OPFS video playback.
```

