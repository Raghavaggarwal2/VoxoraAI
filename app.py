import streamlit as st
from dotenv import load_dotenv

load_dotenv()

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AI Video Assistant",
    page_icon="🎬",
    layout="centered",          # ← centered keeps content from sprawling
    initial_sidebar_state="collapsed",
)

# ── Global CSS ────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

/* ── Reset & base ── */
*, *::before, *::after { box-sizing: border-box; }

html, body, [data-testid="stApp"] {
    background: #0c0c14 !important;
    font-family: 'DM Sans', sans-serif;
    color: #ddd9f0;
}

/* hide chrome */
#MainMenu, footer, header,
[data-testid="stToolbar"],
[data-testid="stDecoration"] { display: none !important; }

/* constrain & pad the main content area */
.block-container {
    padding: 0 2rem 3rem !important;
    max-width: 860px !important;
}

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #0c0c14; }
::-webkit-scrollbar-thumb { background: #2c2c40; border-radius: 2px; }

/* ═══════════════════════════════════
   HERO
═══════════════════════════════════ */
.hero {
    padding: 40px 0 28px;
    border-bottom: 1px solid #1c1c2e;
    margin-bottom: 32px;
}
.hero-tag {
    display: inline-block;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #7c4ddc;
    border: 1px solid rgba(124,77,220,0.35);
    padding: 3px 10px;
    border-radius: 2px;
    margin-bottom: 14px;
    font-family: 'DM Sans', sans-serif;
}
.hero-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(28px, 4vw, 44px);
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: #f2eeff;
    margin-bottom: 10px;
}
.hero-title span { color: #7c4ddc; }
.hero-subtitle {
    font-size: 13px;
    color: #4e4b66;
    letter-spacing: 0.02em;
}

/* ═══════════════════════════════════
   INPUT SECTION
═══════════════════════════════════ */
.input-block {
    background: #10101e;
    border: 1px solid #1c1c2e;
    border-radius: 10px;
    padding: 24px 24px 20px;
    margin-bottom: 20px;
}
.field-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #4e4b66;
    margin-bottom: 8px;
    display: block;
}

/* ── text input ── */
[data-testid="stTextInput"] > div > div > input {
    background: #080812 !important;
    border: 1px solid #2c2c40 !important;
    border-radius: 6px !important;
    color: #ddd9f0 !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 14px !important;
    padding: 10px 14px !important;
    height: 44px !important;
}
[data-testid="stTextInput"] > div > div > input:focus {
    border-color: #7c4ddc !important;
    box-shadow: 0 0 0 3px rgba(124,77,220,0.12) !important;
}
/* hide native streamlit input label */
[data-testid="stTextInput"] label { display: none !important; }

/* ── radio ── */
[data-testid="stRadio"] > div {
    gap: 20px !important;
    flex-direction: row !important;
}
[data-testid="stRadio"] label {
    font-family: 'DM Sans', sans-serif !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #9e9ab8 !important;
    cursor: pointer !important;
}
[data-testid="stRadio"] label:has(input:checked) {
    color: #ddd9f0 !important;
}
[data-testid="stRadio"] > label { display: none !important; }

/* ── file uploader ── */
[data-testid="stFileUploader"] > label { display: none !important; }
[data-testid="stFileUploaderDropzone"] {
    background: #080812 !important;
    border: 1px dashed #2c2c40 !important;
    border-radius: 6px !important;
    padding: 18px !important;
}
[data-testid="stFileUploaderDropzone"] p {
    color: #4e4b66 !important;
    font-size: 13px !important;
}

/* ═══════════════════════════════════
   BUTTONS
═══════════════════════════════════ */
.stButton > button {
    background: #7c4ddc !important;
    color: #fff !important;
    border: none !important;
    border-radius: 6px !important;
    font-family: 'Syne', sans-serif !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    letter-spacing: 0.06em !important;
    padding: 0 22px !important;
    height: 44px !important;
    cursor: pointer !important;
    transition: background 0.18s, transform 0.1s !important;
    width: 100% !important;
}
.stButton > button:hover {
    background: #9462f0 !important;
    transform: translateY(-1px) !important;
}
.stButton > button:disabled {
    background: #2c2c40 !important;
    color: #4e4b66 !important;
}

/* download button — secondary style */
[data-testid="stDownloadButton"] > button {
    background: transparent !important;
    border: 1px solid #2c2c40 !important;
    color: #9e9ab8 !important;
    font-size: 12px !important;
    height: 36px !important;
    letter-spacing: 0.04em !important;
    font-family: 'DM Sans', sans-serif !important;
    font-weight: 500 !important;
    margin-top: 12px !important;
}
[data-testid="stDownloadButton"] > button:hover {
    border-color: #7c4ddc !important;
    color: #ddd9f0 !important;
    background: rgba(124,77,220,0.06) !important;
    transform: none !important;
}

/* ═══════════════════════════════════
   STATUS BAR
═══════════════════════════════════ */
.status-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: #10101e;
    border: 1px solid #1c1c2e;
    border-radius: 6px;
    margin-bottom: 24px;
    font-size: 12px;
    color: #4e4b66;
}
.status-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
}
.status-dot.idle    { background: #2c2c40; }
.status-dot.active  { background: #1ec8a8; box-shadow: 0 0 6px rgba(30,200,168,0.5); }
.status-dot.done    { background: #7c4ddc; box-shadow: 0 0 6px rgba(124,77,220,0.5); }

/* ═══════════════════════════════════
   STATS ROW
═══════════════════════════════════ */
.stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;
}
.stat-card {
    background: #10101e;
    border: 1px solid #1c1c2e;
    border-radius: 8px;
    padding: 14px 18px;
}
.stat-value {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 26px;
    color: #7c4ddc;
    letter-spacing: -0.02em;
    line-height: 1.1;
}
.stat-value.teal { color: #1ec8a8; }
.stat-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #4e4b66;
    margin-top: 4px;
}

/* ═══════════════════════════════════
   RESULT TITLE BLOCK
═══════════════════════════════════ */
.result-header {
    padding: 20px 0 18px;
    border-bottom: 1px solid #1c1c2e;
    margin-bottom: 24px;
}
.result-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #7c4ddc;
    margin-bottom: 6px;
}
.result-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(18px, 3vw, 26px);
    color: #f2eeff;
    letter-spacing: -0.02em;
    line-height: 1.25;
}

/* ═══════════════════════════════════
   TABS
═══════════════════════════════════ */
[data-testid="stTabs"] [role="tablist"] {
    gap: 0 !important;
    border-bottom: 2px solid #1c1c2e !important;
    background: transparent !important;
    margin-bottom: 0 !important;
}
[data-testid="stTabs"] button[role="tab"] {
    font-family: 'Syne', sans-serif !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    letter-spacing: 0.06em !important;
    color: #4e4b66 !important;
    background: transparent !important;
    border: none !important;
    padding: 10px 18px !important;
    border-bottom: 2px solid transparent !important;
    margin-bottom: -2px !important;
    transition: color 0.15s !important;
}
[data-testid="stTabs"] button[role="tab"]:hover {
    color: #9e9ab8 !important;
}
[data-testid="stTabs"] button[role="tab"][aria-selected="true"] {
    color: #f2eeff !important;
    border-bottom-color: #7c4ddc !important;
}
[data-testid="stTabContent"] { padding-top: 20px !important; }

/* ═══════════════════════════════════
   CARDS & CONTENT BLOCKS
═══════════════════════════════════ */
.content-card {
    background: #10101e;
    border: 1px solid #1c1c2e;
    border-radius: 8px;
    padding: 22px 24px;
    position: relative;
    overflow: hidden;
}
.content-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #7c4ddc 0%, #1ec8a8 100%);
}
.card-text {
    font-size: 15px;
    line-height: 1.8;
    color: #b8b4d0;
    white-space: pre-wrap;
    word-break: break-word;
}

/* ═══════════════════════════════════
   LIST ITEMS
═══════════════════════════════════ */
.item-list { list-style: none; padding: 0; margin: 0; }
.item-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 13px 0;
    border-bottom: 1px solid #16162a;
    font-size: 14px;
    color: #b8b4d0;
    line-height: 1.65;
}
.item-list li:last-child { border-bottom: none; padding-bottom: 0; }
.item-num {
    flex-shrink: 0;
    min-width: 22px; height: 22px;
    background: rgba(124,77,220,0.15);
    border: 1px solid rgba(124,77,220,0.25);
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: #7c4ddc;
    font-family: 'Syne', sans-serif;
    margin-top: 1px;
}
.empty-state {
    padding: 28px 0;
    text-align: center;
    font-size: 13px;
    color: #2c2c40;
}

/* ═══════════════════════════════════
   CHAT
═══════════════════════════════════ */
.chat-history {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 18px;
    max-height: 400px;
    overflow-y: auto;
    padding: 4px 2px;
}
.chat-msg {
    max-width: 86%;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.65;
}
.chat-msg.user {
    align-self: flex-end;
    background: rgba(124,77,220,0.16);
    border: 1px solid rgba(124,77,220,0.22);
    color: #ddd9f0;
}
.chat-msg.bot {
    align-self: flex-start;
    background: #10101e;
    border: 1px solid #1c1c2e;
    color: #b8b4d0;
}
.chat-role {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 5px;
    opacity: 0.45;
}

/* chat hint text */
.chat-hint {
    font-size: 13px;
    color: #2c2c40;
    margin-bottom: 16px;
    line-height: 1.6;
}

/* ═══════════════════════════════════
   PROGRESS STEPS
═══════════════════════════════════ */
.step-list { list-style: none; padding: 8px 0; }
.step-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 0;
    font-size: 13px;
    color: #2c2c40;
    border-bottom: 1px solid #12121e;
    transition: color 0.2s;
}
.step-item:last-child { border-bottom: none; }
.step-item.done  { color: #1ec8a8; }
.step-item.active { color: #f2eeff; font-weight: 500; }
.step-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }
.step-check { color: #1ec8a8; font-weight: 700; }

/* ═══════════════════════════════════
   SECTION HEADER
═══════════════════════════════════ */
.sec-head {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 14px;
}
.sec-icon {
    width: 30px; height: 30px;
    background: rgba(124,77,220,0.12);
    border: 1px solid rgba(124,77,220,0.22);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
}
.sec-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 15px;
    color: #c8c4e0;
}

/* ── alerts ── */
[data-testid="stAlert"] {
    background: #10101e !important;
    border: 1px solid #2c2c40 !important;
    border-radius: 6px !important;
    color: #9e9ab8 !important;
    font-size: 13px !important;
}
</style>
""", unsafe_allow_html=True)


# ── Session state ─────────────────────────────────────────────────────────────
for k, v in {
    "pipeline_result": None,
    "processing": False,
    "chat_history": [],
}.items():
    if k not in st.session_state:
        st.session_state[k] = v


# ── Helpers ───────────────────────────────────────────────────────────────────
def parse_list_output(text: str) -> list:
    import re
    lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
    out = []
    for line in lines:
        for prefix in ["•", "-", "*", "–", "—"]:
            if line.startswith(prefix):
                line = line[len(prefix):].strip()
                break
        line = re.sub(r"^\d+[\.\)]\s*", "", line)
        if line:
            out.append(line)
    return out or [text.strip()]


def render_list_items(text: str, fallback: str = "Nothing found."):
    items = parse_list_output(text)
    if not items:
        st.markdown(f'<div class="empty-state">{fallback}</div>', unsafe_allow_html=True)
        return
    rows = "".join(
        f'<li><div class="item-num">{i+1}</div><span>{item}</span></li>'
        for i, item in enumerate(items)
    )
    st.markdown(f'<ul class="item-list">{rows}</ul>', unsafe_allow_html=True)


def run_pipeline_ui(source: str) -> dict:
    from utils.audio_processor import process_input
    from core.transcriber import transcribe_all
    from core.summarize import summarize, generate_title
    from core.extractor import extract_actionable_items, extract_key_decisions, extract_questions
    from core.rag_engine import build_rag_chain

    STEPS = [
        ("🔊", "Processing audio / video source"),
        ("📝", "Transcribing with Whisper"),
        ("🏷️", "Generating title"),
        ("📋", "Summarising content"),
        ("✅", "Extracting action items"),
        ("🔑", "Extracting key decisions"),
        ("❓", "Extracting open questions"),
        ("🧠", "Building RAG knowledge base"),
    ]

    ph = st.empty()

    def draw(done_count):
        rows = ""
        for i, (icon, label) in enumerate(STEPS):
            if i < done_count:
                cls, ico = "done", '<span class="step-check">✓</span>'
            elif i == done_count:
                cls, ico = "active", f'<span class="step-icon">{icon}</span>'
            else:
                cls, ico = "", f'<span class="step-icon" style="opacity:.25">{icon}</span>'
            rows += f'<li class="step-item {cls}">{ico}<span>{label}</span></li>'

        ph.markdown(f"""
        <div class="content-card" style="margin-bottom:0">
            <div style="font-size:11px;font-weight:600;letter-spacing:.15em;
                        text-transform:uppercase;color:#4e4b66;margin-bottom:12px;">
                Pipeline Progress
            </div>
            <ul class="step-list">{rows}</ul>
        </div>""", unsafe_allow_html=True)

    draw(0)
    chunks = process_input(source);           draw(1)
    transcript = transcribe_all(chunks);      draw(2)
    title = generate_title(transcript);       draw(3)
    summary = summarize(transcript);          draw(4)
    action_items = extract_actionable_items(transcript); draw(5)
    key_decisions = extract_key_decisions(transcript);   draw(6)
    questions = extract_questions(transcript);           draw(7)
    rag_chain = build_rag_chain(transcript);             draw(8)

    ph.empty()

    return dict(
        title=title, summary=summary,
        action_items=action_items, key_decisions=key_decisions,
        questions=questions, rag_chain=rag_chain, transcript=transcript,
    )


# ════════════════════════════════════════════════════════════════════════════════
# HERO
# ════════════════════════════════════════════════════════════════════════════════
st.markdown("""
<div class="hero">
    <div class="hero-tag">AI · Video · Assistant</div>
    <div class="hero-title">Turn any video into<br><span>structured intelligence</span></div>
    <div class="hero-subtitle">YouTube URLs &nbsp;·&nbsp; Local files &nbsp;·&nbsp; Instant RAG chat</div>
</div>
""", unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════════════════════
# INPUT BLOCK
# ════════════════════════════════════════════════════════════════════════════════
with st.container():
    st.markdown('<div class="input-block">', unsafe_allow_html=True)

    st.markdown('<span class="field-label">Source type</span>', unsafe_allow_html=True)
    source_type = st.radio(
        "source_type", ["YouTube URL", "Local file"],
        horizontal=True, label_visibility="collapsed",
    )

    st.markdown('<div style="height:14px"></div>', unsafe_allow_html=True)

    source_value = None

    if source_type == "YouTube URL":
        st.markdown('<span class="field-label">YouTube URL</span>', unsafe_allow_html=True)
        url = st.text_input(
            "url", placeholder="https://youtube.com/watch?v=...",
            label_visibility="collapsed", key="yt_url",
        )
        source_value = url.strip() if url else None

    else:
        st.markdown('<span class="field-label">Upload audio / video file</span>', unsafe_allow_html=True)
        uploaded = st.file_uploader(
            "upload", type=["mp4","mp3","wav","m4a","webm","mkv","mov"],
            label_visibility="collapsed",
        )
        if uploaded:
            import tempfile, os
            tmp = tempfile.NamedTemporaryFile(
                delete=False, suffix=os.path.splitext(uploaded.name)[-1]
            )
            tmp.write(uploaded.read()); tmp.flush()
            source_value = tmp.name

    st.markdown('<div style="height:16px"></div>', unsafe_allow_html=True)

    col_btn, col_reset = st.columns([3, 1])
    with col_btn:
        analyze = st.button(
            "⚡  Analyze Video",
            disabled=not source_value or st.session_state.processing,
            key="analyze_btn",
        )
    with col_reset:
        if st.session_state.pipeline_result:
            if st.button("↺ Reset", key="reset_btn"):
                st.session_state.pipeline_result = None
                st.session_state.chat_history = []
                st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)


# ── Trigger pipeline ──────────────────────────────────────────────────────────
if analyze and source_value:
    st.session_state.processing = True
    st.session_state.pipeline_result = None
    st.session_state.chat_history = []
    try:
        result = run_pipeline_ui(source_value)
        st.session_state.pipeline_result = result
    except Exception as e:
        st.error(f"Pipeline error: {e}")
    finally:
        st.session_state.processing = False
    st.rerun()


# ── Status bar ────────────────────────────────────────────────────────────────
if st.session_state.processing:
    dot, msg = "active", "Processing…"
elif st.session_state.pipeline_result:
    dot, msg = "done", "Analysis complete"
else:
    dot, msg = "idle", "Awaiting input"

st.markdown(f"""
<div class="status-bar">
    <span class="status-dot {dot}"></span>
    <span>{msg}</span>
</div>
""", unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════════════════════
# RESULTS
# ════════════════════════════════════════════════════════════════════════════════
if st.session_state.pipeline_result is None and not st.session_state.processing:
    st.markdown("""
    <div style="text-align:center;padding:56px 0 32px;">
        <div style="font-size:52px;opacity:0.1;margin-bottom:16px;">🎬</div>
        <p style="font-family:'Syne',sans-serif;font-size:17px;font-weight:700;
                  color:#2c2c40;letter-spacing:-0.01em;">No analysis yet</p>
        <p style="font-size:13px;color:#222232;margin-top:8px;line-height:1.7;">
            Paste a YouTube URL or upload a video file,<br>
            then hit <strong style="color:#7c4ddc">Analyze Video</strong>.
        </p>
    </div>
    """, unsafe_allow_html=True)

elif st.session_state.pipeline_result:
    r = st.session_state.pipeline_result

    # ── stats row ──
    transcript = r.get("transcript", "")
    word_count = len(transcript.split())
    qa_turns   = len(st.session_state.chat_history) // 2

    st.markdown(f"""
    <div class="stats-row">
        <div class="stat-card">
            <div class="stat-value">{word_count:,}</div>
            <div class="stat-label">Words transcribed</div>
        </div>
        <div class="stat-card">
            <div class="stat-value teal">{qa_turns}</div>
            <div class="stat-label">Q&amp;A turns</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ── title ──
    st.markdown(f"""
    <div class="result-header">
        <div class="result-eyebrow">Detected Title</div>
        <div class="result-title">{r['title']}</div>
    </div>
    """, unsafe_allow_html=True)

    # ── tabs ──
    tab_s, tab_a, tab_d, tab_q, tab_c, tab_t = st.tabs([
        "📋 Summary", "✅ Actions", "🔑 Decisions",
        "❓ Questions", "💬 Chat", "📄 Transcript",
    ])

    # Summary
    with tab_s:
        st.markdown(f"""
        <div class="content-card">
            <div class="card-text">{r['summary']}</div>
        </div>
        """, unsafe_allow_html=True)

    # Actions
    with tab_a:
        st.markdown("""
        <div class="sec-head">
            <div class="sec-icon">✅</div>
            <div class="sec-title">Action Items</div>
        </div>""", unsafe_allow_html=True)
        render_list_items(r["action_items"], "No action items identified.")

    # Decisions
    with tab_d:
        st.markdown("""
        <div class="sec-head">
            <div class="sec-icon">🔑</div>
            <div class="sec-title">Key Decisions</div>
        </div>""", unsafe_allow_html=True)
        render_list_items(r["key_decisions"], "No key decisions found.")

    # Questions
    with tab_q:
        st.markdown("""
        <div class="sec-head">
            <div class="sec-icon">❓</div>
            <div class="sec-title">Open Questions</div>
        </div>""", unsafe_allow_html=True)
        render_list_items(r["questions"], "No open questions found.")

    # Chat
    with tab_c:
        st.markdown("""
        <div class="sec-head">
            <div class="sec-icon">💬</div>
            <div class="sec-title">Chat with your video</div>
        </div>""", unsafe_allow_html=True)

        if st.session_state.chat_history:
            bubbles = "".join(
                f'<div class="chat-msg {m["role"]}">'
                f'<div class="chat-role">{"You" if m["role"]=="user" else "Assistant"}</div>'
                f'{m["content"]}</div>'
                for m in st.session_state.chat_history
            )
            st.markdown(f'<div class="chat-history">{bubbles}</div>',
                        unsafe_allow_html=True)
        else:
            st.markdown("""
            <p class="chat-hint">
                Ask anything about the video — decisions, context, follow-ups…
            </p>""", unsafe_allow_html=True)

        c1, c2 = st.columns([5, 1])
        with c1:
            user_q = st.text_input(
                "q", placeholder="e.g. What were the main blockers?",
                label_visibility="collapsed", key="chat_input",
            )
        with c2:
            send = st.button("Send", key="send_btn")

        if send and user_q.strip():
            from core.rag_engine import ask_question
            q = user_q.strip()
            st.session_state.chat_history.append({"role": "user", "content": q})
            with st.spinner("Thinking…"):
                ans = ask_question(r["rag_chain"], q)
            st.session_state.chat_history.append({"role": "bot", "content": ans})
            st.rerun()

        if st.session_state.chat_history:
            if st.button("Clear chat", key="clear_chat"):
                st.session_state.chat_history = []
                st.rerun()

    # Transcript
    with tab_t:
        st.markdown("""
        <div class="sec-head">
            <div class="sec-icon">📄</div>
            <div class="sec-title">Raw Transcript</div>
        </div>""", unsafe_allow_html=True)
        tx = r.get("transcript", "Transcript not available.")
        st.markdown(f"""
        <div class="content-card">
            <div class="card-text" style="max-height:460px;overflow-y:auto;
                 font-size:14px;line-height:1.75;">{tx}</div>
        </div>""", unsafe_allow_html=True)
        st.download_button(
            "⬇  Download transcript (.txt)",
            data=tx, file_name="transcript.txt", mime="text/plain",
        )