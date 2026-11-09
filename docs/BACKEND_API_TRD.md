# Voxora AI — Backend and FastAPI Adapter Technical Requirements

## 1. Objective
Expose the existing Python AI functionality through a maintainable FastAPI application. This is an adapter/refactor task, not a rewrite of the AI pipeline.

## 2. Core principle
Existing modules are the source of processing behavior. FastAPI should orchestrate and expose them, not duplicate their implementation.

Existing modules visible in the repository:
- `core/extractor.py`
- `core/rag_engine.py`
- `core/summarize.py`
- `core/transcriber.py`
- `core/vector_store.py`
- `utils/audio_processor.py`

Antigravity must inspect exact functions and data contracts before writing routes.

## 3. Target layering
Use the smallest practical structure that fits the audited codebase:

```text
backend/ or api/
  main.py                 # FastAPI app factory/entry point
  api/
    routes/
      health.py
      jobs.py
      results.py
      chat.py
  schemas/
    jobs.py
    results.py
    chat.py
  services/
    job_service.py        # orchestration and job lifecycle
    adapters.py           # thin adapters to existing core functions
  core/                   # preserve current modules; move only if safe
  utils/                  # preserve current utilities
```

This is illustrative. If the existing project is simpler, keep the backend in the current root and avoid unnecessary file moves. Do not create two competing `main.py` files without clear entry-point documentation.

## 4. FastAPI responsibilities
- Validate incoming requests with Pydantic.
- Accept uploads safely.
- Validate and process supported YouTube URLs.
- Create and track processing jobs.
- Invoke existing extraction/audio/transcription/summarization/vector/RAG functions.
- Expose transcript and analysis results.
- Scope chat retrieval to the correct source/job.
- Return consistent errors.
- Configure CORS for the known frontend origin.
- Keep API credentials server-side.

## 5. Job lifecycle
The exact stages must reflect the existing pipeline. Candidate stages to map during audit:

`QUEUED → EXTRACTING/DOWNLOADING → PREPARING_AUDIO → TRANSCRIBING → ANALYZING → INDEXING → COMPLETED`

A job may fail at any stage. Do not expose stages that do not exist in the actual implementation.

Requirements:
- Each job receives an opaque unique ID.
- Store status, current stage, timestamps and error summary.
- Store references to output artifacts, not huge media/transcript payloads in an in-memory status object.
- Ensure one job cannot overwrite another job's files or vector collection.
- Make job state recoverable for the duration supported by the application.
- Use a simple background mechanism first if appropriate for the current single-user/local deployment.
- Do not add Redis/Celery until concurrency, reliability or deployment needs justify it.
- Do not rely on FastAPI `BackgroundTasks` for work that must survive process restarts or run across multiple workers. Document the limitation if using it initially.

## 6. Candidate API surface
Final endpoints and schemas must be based on the audit. Suggested API shape:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/jobs/upload` | Upload media and create job |
| POST | `/api/jobs/youtube` | Submit YouTube URL and create job |
| GET | `/api/jobs/{job_id}` | Get status/stage/progress |
| GET | `/api/jobs/{job_id}/results` | Get available analysis results |
| GET | `/api/jobs/{job_id}/transcript` | Get transcript |
| GET | `/api/jobs/{job_id}/mindmap` | Get Mermaid definition |
| POST | `/api/jobs/{job_id}/chat` | Ask about this source |
| GET | `/api/jobs/{job_id}/download/transcript` | Download transcript |

Do not implement endpoints for features that do not exist. Keep endpoint naming consistent and version only if useful for this application.

## 7. Pydantic contract requirements
Define explicit request and response models for:
- job creation;
- job status;
- processing error;
- results availability;
- transcript;
- summary/insights;
- mind map;
- chat request/response.

Use actual output fields from the existing core modules. Avoid `Any`-heavy contracts where a clear schema can be defined. Do not fabricate fields such as speaker labels, timestamps, confidence, citations, or action-item owners if the current pipeline does not produce them.

## 8. Upload and URL safety
- Enforce a configurable upload size limit.
- Allow only formats actually supported by the current media pipeline.
- Validate extension and content type; do not trust filename alone.
- Generate server-side filenames; do not use user-supplied paths.
- Store uploads in controlled temporary/job directories.
- Clean temporary artifacts on success/failure according to a documented retention policy.
- Restrict YouTube extraction to supported hosts and validate redirects/URLs to reduce SSRF risk.
- Never pass arbitrary user-supplied filesystem paths to core functions.

## 9. Secrets and configuration
- Preserve current environment variable names when possible.
- Load provider keys from backend environment.
- Never return keys to the frontend or log them.
- Never modify or overwrite the user's `.env`.
- Maintain a safe `.env.example` with names and placeholders only.
- Document required external tools such as FFmpeg.

## 10. RAG isolation
- Every chat request must identify the job/source context.
- Verify vector store collection naming and metadata filtering.
- Prevent retrieval across different jobs.
- Preserve the current embedding model and chunking behavior unless there is a demonstrated defect.
- Clean up vector records only under an explicit retention policy; never clear existing `vector_db/` data as part of migration.

## 11. Errors and observability
Use consistent JSON errors with:
- stable error code;
- safe user-facing message;
- optional retryable flag;
- optional stage/job context.

Do not expose Python tracebacks, API keys, local absolute paths or raw provider internals to clients. Log diagnostic details server-side with secrets redacted.

## 12. Backend acceptance criteria
- FastAPI starts with a documented command.
- Existing core functions are invoked rather than reimplemented.
- Upload and YouTube jobs can be created.
- Job lifecycle can be queried.
- Existing transcript, summary, mind map and RAG behavior remains intact.
- Chat is scoped to the correct source.
- Upload and URL validation are enforced.
- No secret is exposed to the browser.
- Tests cover adapters, API schemas, job lifecycle and core integration.
