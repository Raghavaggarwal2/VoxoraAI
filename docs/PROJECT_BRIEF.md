# Voxora AI — Project Brief

## 1. Product summary
Voxora AI converts video and audio content into structured, searchable knowledge. A user supplies a YouTube URL or uploads a supported media file. The application processes the media and presents the transcript, AI-generated understanding, visual mind map, and a question-answering interface grounded in the source content.

## 2. Project status and goal
The existing Python application already contains core processing modules. The current project is a **UI and application-layer modernization**, not a rebuild of the AI product.

Primary goal:
- Replace the Streamlit-facing experience with a polished React application.
- Expose existing Python capabilities through FastAPI.
- Preserve the existing AI pipeline and user-visible features.
- Make the frontend/backend separation maintainable.

## 3. Existing repository evidence
The supplied VS Code screenshot shows:
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
- `.env`, `requirements.txt`, `pyproject.toml`, `uv.lock`, `README.md`, `PRD.txt`, `TRD.txt`

This is a directory-level inventory only. Antigravity must inspect source code to discover actual responsibilities, public functions, data formats, and runtime behavior.

## 4. User-facing capabilities to preserve
The audit must confirm which of these are currently implemented and how they work:
1. YouTube URL input.
2. Local audio/video upload.
3. Media download/extraction and audio preparation.
4. Speech transcription.
5. Transcript display and export.
6. AI summary and structured content analysis.
7. Mind map generation/rendering.
8. Retrieval-augmented chat over processed content.
9. Processing feedback and error handling.

Do not mark a capability as implemented solely because a similarly named file exists.

## 5. Users and primary journey
Target users include students, researchers, professionals and creators who need to understand long videos, lectures, interviews, podcasts, meetings or presentations.

Main journey:
1. Open Voxora AI.
2. Choose YouTube URL or upload a local media file.
3. Review source details and start processing.
4. See clear progress and current processing stage.
5. Open the completed workspace.
6. Explore transcript, summary/insights and mind map.
7. Ask follow-up questions in the source-grounded chat.
8. Download/export the transcript or supported results.

## 6. Product principles
- Clarity over visual complexity.
- Trustworthy outputs: distinguish source transcript from AI-generated interpretation.
- Keep the original content accessible while exploring derived insights.
- Show honest processing states; never simulate progress or invent completed results.
- Responsive, accessible, fast interface.
- Secrets and AI processing remain server-side.

## 7. Out of scope unless already implemented
Do not add these as part of this migration without approval:
- User accounts and authentication.
- Subscription/billing.
- Team collaboration.
- Cloud sync.
- New AI providers or model changes.
- Live meeting transcription.
- A new database or distributed task infrastructure solely for architectural fashion.

## 8. Success criteria
- Existing supported input types and workflows continue to work.
- React frontend can start independently from the Python backend.
- FastAPI invokes existing processing logic.
- User sees reliable processing status and useful errors.
- All existing result types remain accessible.
- Chat retrieval is scoped to the correct source/job.
- No secrets are exposed to the browser.
