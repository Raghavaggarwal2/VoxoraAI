# Voxora AI — Antigravity Implementation Plan

## Phase 0 — Audit (no code changes)
- Read project docs and inspect source.
- Map every existing feature to its implementation.
- Verify entry points and run commands.
- Identify current UI/backend coupling.
- Produce `docs/CODEBASE_AUDIT_REPORT.md`.
- Identify regressions risks and propose minimal migration.

**Gate:** User can review the audit before destructive or broad structural changes.

## Phase 1 — Backend extraction / API adapter
- Create FastAPI app using the simplest structure compatible with current code.
- Reuse current core modules through thin adapters.
- Add Pydantic request/response models based on real outputs.
- Add job lifecycle and safe temporary-file handling.
- Add health, upload, YouTube, status, results, chat and download routes only for verified features.
- Preserve current Streamlit app temporarily so there is a fallback during migration.
- Add tests for adapters and API routes.

**Gate:** Existing pipeline can be invoked through API and results match the current app.

## Phase 2 — React foundation
- Create Vite React JavaScript app.
- Add routing, Tailwind and agreed component system.
- Add central API client.
- Build shared layout and responsive navigation.
- Keep all files `.js`/`.jsx`.

**Gate:** Frontend builds and can reach backend health endpoint.

## Phase 3 — Main user journey
- Build home/upload/YouTube input.
- Connect job creation.
- Build honest processing state and status polling.
- Handle errors and refresh/navigation behavior.
- Verify upload and YouTube flows.

**Gate:** User can submit a source and see real processing state.

## Phase 4 — Results workspace
- Connect transcript and download.
- Connect summary/insights.
- Render Mermaid mind map safely.
- Connect RAG chat.
- Add empty/loading/error states.
- Verify job/source isolation.

**Gate:** All verified existing capabilities are accessible from React.

## Phase 5 — UI polish and verification
- Responsive QA at desktop/tablet/mobile.
- Accessibility and keyboard checks.
- Browser verification.
- Backend and frontend tests/build.
- Check logs for leaked secrets or unsafe errors.
- Document setup and run commands.
- Keep Streamlit fallback until the new app is verified; remove it only with explicit confirmation.

## Required final report
Antigravity must report:
1. Files created/changed.
2. Existing core modules reused.
3. Features preserved and verified.
4. Commands to install and run frontend/backend.
5. Tests/build/browser checks and results.
6. Environment variables required (names only).
7. Known limitations and unverified flows.
8. Any remaining manual setup.

## Do not
- Rebuild the AI pipeline.
- replace providers/models without approval.
- Delete `downloads/`, `vector_db/`, `.env`, or existing user data.
- fabricate demo output in real workflows.
- add infrastructure without a demonstrated need.
- convert frontend to TypeScript.
