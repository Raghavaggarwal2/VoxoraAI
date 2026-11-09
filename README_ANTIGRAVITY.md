# Voxora AI — Antigravity Handoff Pack

This pack is written for the **existing Voxora AI repository**, not for a greenfield rebuild.

## What you are building

Refactor the existing Streamlit-based Voxora AI application into:
- **Frontend:** React + Vite + JavaScript (ES6+) + JSX + Tailwind CSS.
- **Backend:** FastAPI + Python + Pydantic.
- **AI/core processing:** Preserve and reuse the existing Python modules.

The screenshot of the repository shows these existing modules:
- `core/extractor.py`
- `core/rag_engine.py`
- `core/summarize.py`
- `core/transcriber.py`
- `core/vector_store.py`
- `utils/audio_processor.py`
- `downloads/`
- `vector_db/`
- `app.py`
- `main.py`
- Existing dependency/configuration files such as `requirements.txt`, `pyproject.toml`, and `uv.lock`.

The screenshot does not reveal the implementation details inside those files. Antigravity must inspect the actual source before designing API contracts or changing code.

## Read these documents in order

1. `AGENTS.md` — persistent rules and non-negotiable constraints.
2. `docs/PROJECT_BRIEF.md` — product scope and intended user experience.
3. `docs/EXISTING_CODEBASE_AUDIT.md` — mandatory discovery checklist.
4. `docs/FRONTEND_TRD.md` — React frontend requirements.
5. `docs/BACKEND_API_TRD.md` — FastAPI adapter/backend requirements.
6. `docs/API_INTEGRATION_CONTRACT.md` — frontend/backend contract requirements.
7. `docs/UI_DESIGN_BRIEF.md` — visual design direction and interaction details.
8. `docs/IMPLEMENTATION_PLAN.md` — safe phased execution and acceptance gates.

## First Antigravity task

Do not start coding immediately. Ask Antigravity to perform the repository audit described in `docs/EXISTING_CODEBASE_AUDIT.md`, inspect the current PRD/TRD and all relevant Python modules, then produce:
- current architecture map;
- existing feature-to-file mapping;
- current entry-point behavior (`app.py` and `main.py`);
- dependencies and run commands;
- existing API/backend capabilities, if any;
- risks and recommended minimal migration plan;
- questions/unknowns that cannot be answered from source.

Only after this audit should implementation begin.

## Critical instruction

Do not replace, rewrite, or simplify the working AI pipeline just to fit a preferred architecture. Keep the existing business logic and wrap it behind FastAPI endpoints. Change internal modules only when the audit demonstrates a concrete integration issue, and preserve behavior with tests.
