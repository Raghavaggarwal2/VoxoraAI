# Voxora AI — UI Design Brief

## Design objective
Create a polished, memorable AI video/audio intelligence workspace. The product should feel like a focused tool for turning long-form media into knowledge—not a generic admin dashboard.

## Visual personality
- Modern, thoughtful, calm and premium.
- Editorial typography suitable for reading long transcripts.
- Dark or light theme may be selected by the designer, but maintain strong contrast and a coherent palette.
- One primary accent color; use gradients sparingly.
- Subtle borders, restrained shadows, consistent corner radius.
- Motion should clarify transitions, not decorate every element.

## Information architecture

### Home
1. Brand/navigation header.
2. Clear headline explaining the value.
3. Main input card with YouTube and file-upload modes.
4. Supported formats/usage note.
5. Short explanation of the workflow.
6. Optional feature preview using illustrative visuals, clearly not fake user data.

### Processing
1. Source name/URL.
2. Current stage and truthful progress.
3. Clear status message.
4. Cancel/retry only if backend supports those actions.
5. Helpful error recovery.

### Workspace
1. Header with source name and job status.
2. Navigation for Overview, Transcript, Mind Map and Chat (adapt based on actual features).
3. Overview: summary and structured insights.
4. Transcript: readable text, search if feasible, download action.
5. Mind map: large canvas with safe rendering.
6. Chat: conversational panel tied to the active source.
7. Responsive behavior that prioritizes reading and interaction.

## Interaction details
- File dropzone has idle, drag-over, selected, uploading and invalid states.
- URL field has empty, invalid and valid states.
- Start button has idle, submitting and disabled states.
- Processing has queued, active, completed and failed states.
- Result panels have loading, available, empty and failed states.
- Chat has empty, typing, response and failure states.
- All controls must work; remove controls that have no real action.

## Content design
- Separate transcript (source-derived) from AI-generated summary/interpretation.
- Use concise section headings.
- Preserve paragraphs and timestamps if they exist in transcript output.
- Do not fabricate metadata, citations, durations, speakers, metrics or processing percentages.

## Responsive design
- Desktop: comfortable workspace with persistent section navigation.
- Tablet: compact navigation and stacked panels.
- Mobile: single-column reading flow, touch-friendly controls, no horizontal page overflow.
- Mind map may use a horizontally pannable/zoomable canvas.

## Deliverable
Before implementation, create a small design system note listing:
- color tokens;
- typography scale;
- spacing scale;
- border/radius/shadow tokens;
- button/input/card/tab styles;
- breakpoints;
- icon source;
- motion rules.

Then implement the actual UI and verify it in the browser at desktop and mobile sizes.
