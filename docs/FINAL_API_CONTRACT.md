# Voxora AI — Final Backend API Integration Contract

**Version:** 0.1.0  
**Base URL:** `http://localhost:8000/api` (configurable in frontend via `VITE_API_BASE_URL`)  
**Backend Entrypoint:** `backend/main.py`  
**Authentication / Credentials:** Stored strictly server-side in `.env` (`GROQ_API_KEY`, `MISTRALAI_API_KEY`). No API keys are accepted from the browser.

---

## 1. Overview of Endpoints

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/api/health` | Service health and AI provider configuration status | `200 OK` |
| `POST` | `/api/jobs/upload` | Upload a local audio/video file for processing | `202 Accepted` |
| `GET` | `/api/jobs/{job_id}` | Poll job status, current stage, and progress | `200 OK` / `404 Not Found` |
| `GET` | `/api/jobs/{job_id}/results` | Retrieve structured AI analysis results | `200 OK` / `409 Conflict` |
| `GET` | `/api/jobs/{job_id}/transcript` | Retrieve raw speech transcript | `200 OK` / `409 Conflict` |
| `GET` | `/api/jobs/{job_id}/mindmap` | Retrieve sanitized Mermaid mind map syntax | `200 OK` / `409 Conflict` |
| `GET` | `/api/jobs/{job_id}/download/transcript` | Download plain-text transcript file attachment | `200 OK` / `409 Conflict` |
| `POST` | `/api/jobs/{job_id}/chat` | Ask questions grounded exclusively in the job transcript | `200 OK` / `409 Conflict` |

---

## 2. Standard Enums

### `JobStatus`
* `queued`: Job created and waiting for background execution.
* `processing`: Job currently progressing through pipeline stages.
* `completed`: Processing succeeded; results and RAG chain are ready.
* `failed`: An error occurred; `error` envelope contains details.

### `JobStage`
* `queued` (0%)
* `preparing_audio` (15%): Normalizing local audio/video to 16kHz mono WAV via `pydub`/`ffmpeg`.
* `transcribing` (40%): Segmenting audio into 5-minute chunks and transcribing with Groq `whisper-large-v3`.
* `analyzing` (70%): Generating Title, Summary, Action Items, Key Decisions, Questions, and Mermaid Mind Map via Mistral AI.
* `indexing` (90%): Ingesting transcript chunks into a scoped ChromaDB collection (`job_{job_id}`) using HuggingFace embeddings.
* `completed` (100%): All artifacts generated and queryable.
* `failed`: Execution halted.

---

## 3. Endpoint Specifications

### 3.1 Health Check
`GET /api/health`

**Response (`200 OK`):**
```json
{
  "status": "ok",
  "service": "Voxora AI API",
  "version": "0.1.0",
  "providers": {
    "groq": {
      "configured": true,
      "model": "whisper-large-v3"
    },
    "mistral": {
      "configured": true
    }
  }
}
```

---

### 3.2 Submit Local Media Upload Job
`POST /api/jobs/upload`  
**Content-Type:** `multipart/form-data`

**Form Fields:**
* `file` (UploadFile, required): Accepted extensions: `.mp4`, `.mp3`, `.wav`, `.m4a`, `.webm`, `.mkv`, `.mov`. Maximum size: 200MB.
* `language` (string, optional): `"auto"` (default), `"hi"`, `"en"`, etc.

**Response (`202 Accepted`):**
```json
{
  "job_id": "92db4965-4f40-4963-88ec-8f4316a301ec",
  "status": "queued",
  "stage": "queued",
  "message": "Upload processing job created successfully"
}
```

---

### 3.4 Poll Job Status
`GET /api/jobs/{job_id}`

**Response (`200 OK` - Processing):**
```json
{
  "job_id": "c62a048a-6379-4d37-88d3-5e92be7694f2",
  "status": "processing",
  "stage": "transcribing",
  "progress_percent": 40,
  "status_message": "Transcribing 3 audio segment(s) with Whisper...",
  "created_at": "2026-11-09T12:00:00Z",
  "completed_at": null,
  "error": null
}
```

**Response (`200 OK` - Completed):**
```json
{
  "job_id": "c62a048a-6379-4d37-88d3-5e92be7694f2",
  "status": "completed",
  "stage": "completed",
  "progress_percent": 100,
  "status_message": "Analysis complete",
  "created_at": "2026-11-09T12:00:00Z",
  "completed_at": "2026-11-09T12:01:15Z",
  "error": null
}
```

---

### 3.5 Get Analysis Results
`GET /api/jobs/{job_id}/results`

**Response (`200 OK`):**
```json
{
  "job_id": "c62a048a-6379-4d37-88d3-5e92be7694f2",
  "title": "Quantum Computing Architecture & Scaling",
  "summary": "### Overview\nThe team discussed quantum circuit noise mitigation...\n\n### Key Discussion Points\n* Qubit coherence stability...",
  "action_items": "1. **Implement noise mitigation filter**\n   - Owner: Alice\n   - Deadline: Nov 15\n2. **Run simulation benchmarks**\n   - Owner: Bob\n   - Deadline: Not specified",
  "key_decisions": "1. Adopt Python for high-level simulation orchestration.\n2. Deprecate legacy measurement pipeline.",
  "questions": "1. How will cryogenic cooling scale past 1,000 qubits?",
  "mindmap": "mindmap\n  root((\"Quantum Computing Architecture\"))\n    n1[\"`Hardware Scaling`\"]\n    n2[\"`Qubit Coherence`\"]\n    n3[\"`Compiler Optimizations`\"]",
  "word_count": 1420,
  "has_transcript": true
}
```

---

### 3.6 Get Raw Transcript
`GET /api/jobs/{job_id}/transcript`

**Response (`200 OK`):**
```json
{
  "job_id": "c62a048a-6379-4d37-88d3-5e92be7694f2",
  "transcript": "Good morning everyone. Today we are reviewing our quantum computing architecture...",
  "word_count": 1420
}
```

---

### 3.7 Download Transcript File
`GET /api/jobs/{job_id}/download/transcript`

**Response (`200 OK`):**
* **Content-Type:** `text/plain; charset=utf-8`
* **Content-Disposition:** `attachment; filename="transcript_c62a048a.txt"`
* **Body:** Plain-text raw transcript.

---

### 3.8 Grounded RAG Chat
`POST /api/jobs/{job_id}/chat`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "question": "What deadline was assigned to Alice?"
}
```

**Response (`200 OK`):**
```json
{
  "job_id": "c62a048a-6379-4d37-88d3-5e92be7694f2",
  "question": "What deadline was assigned to Alice?",
  "answer": "Alice was assigned the task of implementing the noise mitigation filter with a deadline of November 15."
}
```

---

## 4. Error Envelope Specification

All HTTP error responses (`4xx` and `5xx`) adhere to the unified envelope:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation of what went wrong.",
    "retryable": false,
    "details": null
  }
}
```

### Common Error Codes
* `JOB_NOT_FOUND` (`404`): The specified job ID does not exist in the active store.
* `RESULTS_NOT_READY` (`409`): Analysis results or knowledge base are still processing.
* `JOB_FAILED` (`400`): The processing job failed at one of the pipeline stages.
* `INVALID_FILE_TYPE` (`400`): Uploaded media format extension is not permitted.
* `FILE_TOO_LARGE` (`413`): Uploaded media exceeds maximum allowed file size.
* `VALIDATION_ERROR` (`422`): Request body or URL parameters failed Pydantic validation.
* `CONFIGURATION_ERROR` (`500`): Required server credentials (`GROQ_API_KEY` or `MISTRALAI_API_KEY`) are missing.
* `INTERNAL_SERVER_ERROR` (`500`): Unhandled server exception with secrets and tracebacks redacted.

