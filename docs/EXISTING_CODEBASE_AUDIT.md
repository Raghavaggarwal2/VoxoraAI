# Mandatory Existing Codebase Audit

## Purpose
Understand what already works before changing architecture. This audit is the first task for Antigravity.

## 1. Inspect these files and folders
Read, do not modify initially:
- `README.md`
- `PRD.txt`
- `TRD.txt`
- `app.py`
- `main.py`
- all files in `core/`
- all files in `utils/`
- dependency/configuration files: `requirements.txt`, `pyproject.toml`, `uv.lock`, `.python-version`
- `.gitignore`
- relevant Streamlit configuration under `.streamlit/`
- tests, if present

Do not read or print `.env` secret values. You may inspect variable names without revealing values.

## 2. Build a feature-to-code map
For each existing feature, record:
- user action in current Streamlit UI;
- entry-point function;
- modules/functions invoked;
- input and output types;
- external APIs/models used;
- temporary/persistent files written;
- error cases;
- whether it is verified working, partially working, or unknown.

Cover URL extraction, upload, audio processing, transcription, summarization, mind map, vector storage, RAG retrieval/chat, downloads and cleanup.

## 3. Resolve entry points
Determine exactly:
- What `app.py` does.
- What `main.py` does.
- Which command currently starts the app.
- Whether either file already contains FastAPI code.
- Whether Streamlit is the only current UI.
- Whether a backend/API layer already exists.

Do not assume `main.py` is the FastAPI entry point.

## 4. Inspect function contracts
For each core module, identify public functions/classes and document:
- exact function signature;
- synchronous or asynchronous behavior;
- return structure;
- exceptions;
- required environment variables;
- filesystem assumptions;
- whether it can safely be called concurrently.

Do not change these contracts before documenting them.

## 5. Inspect data lifecycle
Determine:
- how downloaded media is named and stored;
- how temporary audio is created and cleaned;
- how transcript and summary results are stored;
- how ChromaDB collections/IDs are created;
- whether vector data is isolated per source;
- whether existing data in `downloads/` or `vector_db/` must be retained.

Never delete existing files or vector data during the audit.

## 6. Dependency and run audit
Record:
- Python version;
- package manager in use;
- exact current install command;
- exact current run command;
- required external binaries such as FFmpeg;
- environment variable names (never values);
- test/lint commands, if configured.

Avoid adding duplicate or conflicting dependency managers.

## 7. Deliverable
Create `docs/CODEBASE_AUDIT_REPORT.md` with:
1. Current architecture diagram.
2. File/module responsibility table.
3. Feature-to-code mapping.
4. Existing entry-point explanation.
5. Function contract inventory.
6. Data and storage lifecycle.
7. Dependency and environment inventory.
8. Verified issues and risks.
9. Minimal proposed target architecture.
10. Migration sequence and rollback strategy.
11. Questions that require the user's decision.

## 8. Stop condition
Do not implement the frontend or change backend structure until the audit report is complete and the migration plan clearly identifies which existing functions will be reused.
