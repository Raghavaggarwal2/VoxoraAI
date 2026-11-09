# Voxora AI — Antigravity Workspace Rules

These rules apply to all work in this repository.

## Product and migration context
- This is an existing, partially/fully implemented Python AI application. It is not a greenfield project.
- The current goal is to replace/improve the Streamlit presentation layer with a polished React frontend and expose existing Python functionality through a FastAPI backend.
- Existing core modules visible in the repository include `core/extractor.py`, `core/rag_engine.py`, `core/summarize.py`, `core/transcriber.py`, `core/vector_store.py`, and `utils/audio_processor.py`.
- Inspect the actual code before making assumptions. The screenshot is only a directory overview, not proof of exact function signatures or behavior.

## Non-negotiable technology choices
- Frontend language: **JavaScript ES6+ only**.
- React components: JSX in `.jsx` files.
- Frontend utilities, hooks, API clients and configuration: `.js` files.
- Do not introduce TypeScript, `.ts`, `.tsx`, TypeScript compiler configuration, or TypeScript-only libraries.
- Backend: Python + FastAPI + Pydantic.
- Reuse the current AI providers, models, prompt logic, chunking strategy, embeddings, vector store, media utilities and processing behavior unless the user explicitly approves a change.
- Use the package manager and dependency workflow already established by the repository where practical. Inspect `pyproject.toml`, `uv.lock`, `requirements.txt`, and `.python-version` before changing dependencies.

## Preserve existing functionality
- Do not delete or rewrite the existing `core/` or `utils/` modules as a first step.
- Do not replace the current transcription, summarization, extraction, RAG, embedding, or vector-store implementation with mock logic or a different provider.
- Do not silently remove any feature currently available in the Streamlit app.
- Treat `PRD.txt`, `TRD.txt`, `README.md`, and source code as evidence. If they conflict, report the conflict and prefer verified current behavior until the user decides otherwise.
- Keep existing environment variable names where possible. Never print, expose, commit, or copy secret values.
- Never overwrite `.env`. Update `.env.example` only with variable names and safe placeholders, if needed.
- Preserve existing local data in `downloads/` and `vector_db/`. Never delete or clear them without explicit approval.

## Engineering process
1. Audit first. Map current behavior, functions, dependencies, and entry points.
2. Write a migration plan before structural changes.
3. Implement in small, reviewable phases.
4. Keep the app runnable after each phase.
5. Add tests around existing behavior before changing core logic.
6. Run relevant tests, lint/build checks, and manual browser verification.
7. Report changed files, commands run, test results, and known limitations.

## Architecture boundaries
- React must not call Groq, Mistral, HuggingFace, ChromaDB, FFmpeg, or yt-dlp directly.
- All secrets and AI-provider calls stay on the Python backend.
- React communicates with FastAPI through a centralized API client.
- FastAPI route handlers should validate requests, invoke application/service functions, and return structured responses. Avoid putting long AI pipeline logic directly inside route functions.
- Reuse existing core functions through thin adapters. Do not duplicate their logic.
- Long-running media/AI work must not block the HTTP request until completion. Use a job-based approach compatible with the existing deployment constraints.
- Do not introduce Redis, Celery, PostgreSQL, authentication, cloud storage, or other infrastructure unless the audit proves it is required and the user approves it.

## Frontend quality
- Build a cohesive, responsive product UI, not a generic admin dashboard.
- Include loading, empty, error, success, disabled, and processing states.
- Make upload and YouTube input understandable and accessible.
- Render transcript, summary, insights, mind map, and chat in a clear workspace.
- Avoid fake metrics, fake history, fake AI output, and decorative controls that do nothing.
- Use accessible labels, keyboard support, sensible focus states, and responsive layouts.

## API and data safety
- Validate uploaded files by size, extension and content/MIME where practical.
- Treat YouTube URLs as untrusted input; validate supported hosts and prevent SSRF.
- Use safe temporary file handling and cleanup.
- Isolate results and vector collections by job/session so one job cannot retrieve another job's data.
- Return consistent error shapes without leaking stack traces, secrets, local paths, or provider credentials.
- Do not invent response fields. Derive contracts from inspected core functions and actual frontend needs.

## Completion standard
A task is not complete merely because code was generated. Verify the frontend build, backend startup, API integration, and the end-to-end upload/YouTube → transcript → analysis → mind map/RAG flow as far as credentials and test fixtures permit.
