# Voxora AI — Frontend/Backend Integration Contract

## 1. Purpose
Define how the React application communicates with FastAPI. This is a contract template: Antigravity must finalize it after inspecting the current Python functions and output formats.

## 2. Base configuration
Frontend reads a public backend base URL from Vite configuration, for example `VITE_API_BASE_URL`. This is not a secret.

All AI provider keys remain in the Python backend environment.

## 3. Job creation
### Upload (Primary and Only Ingestion Method)
`POST /api/jobs/upload`

- Content type: `multipart/form-data`
- Form field name (`file`) and accepted file formats (`mp4`, `mp3`, `wav`, `m4a`, `webm`, `mkv`, `mov`, up to 200MB).
- Response: job identifier and initial status (`202 Accepted`).

*(Note: Public YouTube URL ingestion has been removed from the React application and FastAPI backend. Streamlit `app.py` and CLI `main.py` retain backward-compatible local/CLI handling).*

## 4. Job status
`GET /api/jobs/{job_id}`

The response must provide enough information for the UI to show:
- job ID;
- status;
- current stage;
- optional progress value, only when meaningful;
- safe status message;
- error information when failed;
- whether results are ready.

Suggested status values: `queued`, `processing`, `completed`, `failed`. The actual stage is a separate field. Agree on casing and enum values in the implementation; do not mix conventions.

## 5. Results
`GET /api/jobs/{job_id}/results`

Return the available outputs and their readiness. Do not make the frontend assume all outputs exist if a pipeline stage is optional or failed.

Transcript, summary, mind map and other outputs may use dedicated endpoints if payload size or current architecture makes that preferable.

## 6. Chat
`POST /api/jobs/{job_id}/chat`

Request includes the user's question. Response includes the answer and, only if supported by the existing RAG pipeline, source references/metadata.

The backend must scope retrieval to this job.

## 7. Download
Use a backend download endpoint or a safe artifact URL. The frontend must not construct filesystem paths.

## 8. Error envelope
Adopt one consistent shape, for example:

```json
{
  "error": {
    "code": "PROCESSING_FAILED",
    "message": "The media could not be processed.",
    "retryable": false
  }
}
```

The final schema should be represented in Pydantic and mirrored in JavaScript documentation/JSDoc where useful. Do not maintain a manually duplicated TypeScript interface file.

## 9. Integration rules
- Centralize requests in frontend `services/`.
- Handle HTTP errors and network errors consistently.
- Prevent duplicate job submissions.
- Clean up polling timers/requests when a page unmounts or job changes.
- Handle refresh/navigation without losing the active job when the backend supports it.
- Do not expose internal stack traces.
- Add integration tests for successful and failed flows.

## 10. Contract sign-off
Before final UI integration, Antigravity must create `docs/FINAL_API_CONTRACT.md` containing actual paths, request fields, response examples, status enums, error codes and download behavior derived from the implemented backend.
