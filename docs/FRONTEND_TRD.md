# Voxora AI — Frontend Technical Requirements

## 1. Objective
Build a modern React user interface to replace the current Streamlit UI while preserving the existing Voxora AI workflow.

## 2. Mandatory stack
- React
- Vite
- JavaScript ES6+
- JSX
- Tailwind CSS
- React Router
- Axios or the existing approved HTTP client
- Mermaid.js for rendering mind maps
- A consistent accessible component system (shadcn/ui may be used if compatible with the chosen JavaScript setup)

**JavaScript-only rule:** `.js` and `.jsx` only. No TypeScript, `.ts`, `.tsx`, `tsconfig.json`, or TypeScript-specific tooling.

## 3. Suggested structure
Adapt this to the existing repository after the audit. Do not create duplicate frontend folders.

```text
frontend/
  public/
  src/
    app/
      App.jsx
      router.jsx
    assets/
    components/
      common/
      upload/
      processing/
      transcript/
      summary/
      insights/
      mindmap/
      chat/
    pages/
      HomePage.jsx
      WorkspacePage.jsx
      NotFoundPage.jsx
    layouts/
    hooks/
    services/
      api.js
      jobs.js
      results.js
      chat.js
    utils/
    styles/
      index.css
    main.jsx
  index.html
  package.json
  vite.config.js
```

## 4. Screens and behavior

### 4.1 Home / New analysis
- Strong product identity and concise explanation.
- Two clear input modes: YouTube URL and local file.
- Drag-and-drop file area plus browse button.
- Show supported file types and size limit based on actual backend validation.
- Validate obvious client-side errors, but backend remains authoritative.
- Show selected filename/source and allow removal/change before submission.
- Primary action starts processing and prevents duplicate submissions.
- Show useful errors for invalid URL, unsupported file, oversized file and network failure.

### 4.2 Processing state
- Show job/source identity.
- Display the real stage/status returned by the backend.
- Use a determinate progress bar only if the backend provides meaningful progress. Otherwise use honest indeterminate progress and stage labels.
- Handle queued, processing, completed and failed states.
- Poll at a sensible interval with cleanup, or use SSE/WebSocket only if supported by the backend and justified.
- Recover from refresh using a persisted job ID in the URL or another deliberate mechanism, if supported.
- Do not fake percentages or claim a stage is complete before the backend confirms it.

### 4.3 Results workspace
Create a focused workspace with:
- source title/filename and processing metadata;
- transcript view;
- summary and key insights;
- action items/decisions/questions if the current summarizer provides them;
- mind map view;
- source-grounded chat;
- download/export controls for formats the backend actually supports.

Use tabs, split panels or a responsive navigation pattern. Keep the transcript and derived insights easy to switch between. Avoid cramming every panel onto one screen.

### 4.4 Chat
- Clear user and assistant message styles.
- Loading/streaming state only if supported.
- Disable sending while a request is pending where necessary.
- Handle empty questions and backend failures.
- Keep chat associated with the active job/source.
- Display citations/source chunks only if the backend actually returns them.
- Do not invent sources or confidence scores.

### 4.5 Mind map
- Render backend-provided Mermaid definition using Mermaid.js.
- Show a readable error state if the definition is invalid.
- Support a loading/empty state.
- Avoid injecting untrusted HTML. Sanitize or use Mermaid's safe security configuration.
- Add zoom/download controls only if implemented and tested.

## 5. Visual direction
Create a polished AI knowledge workspace, not a generic SaaS admin dashboard.

Suggested visual qualities:
- Modern, calm, editorial technology aesthetic.
- Strong typography hierarchy.
- Neutral/dark foundation with one restrained accent color.
- Spacious layouts, clear cards and subtle borders.
- Carefully used motion; respect reduced-motion preferences.
- Consistent spacing, radii, shadows and icon style.
- High contrast and accessible focus indicators.

Avoid:
- Excessive gradients and glowing effects.
- Too many nested cards.
- Decorative charts unrelated to actual data.
- Fake analytics or sample results presented as real.
- Excessive animation that slows the workflow.

## 6. Responsive behavior
- Desktop: full workspace with side navigation or tabs and comfortable reading width.
- Tablet: compact navigation and adaptable panels.
- Mobile: stacked sections, touch-friendly controls, no horizontal overflow.
- Mind map must remain usable on narrow screens, with horizontal pan/zoom as appropriate.

## 7. Frontend architecture
- Centralize API base URL and HTTP configuration.
- Keep API functions separate from components.
- Use reusable hooks for job polling and request state.
- Keep components focused and composable.
- Use React state/hooks initially; do not add a global state library unless actual complexity warrants it.
- Use JSDoc selectively for complex utility contracts.
- Do not store secrets in Vite environment variables. Anything prefixed for client exposure is public.

## 8. Accessibility and UX
- Semantic HTML and labels.
- Keyboard-accessible dialogs, tabs, menus and upload actions.
- Visible focus states.
- Useful empty/loading/error states.
- Announce important asynchronous status changes accessibly.
- Do not rely on color alone to communicate state.

## 9. Frontend acceptance criteria
- Runs independently using Vite.
- Uses JavaScript and JSX only.
- Supports all verified current user workflows.
- No fake backend responses in production paths.
- Handles all job lifecycle states.
- Displays real backend results.
- Mind map rendering is safe and resilient.
- Responsive at mobile, tablet and desktop sizes.
- Build and browser checks pass.
