import streamlit as st
import os

# Suppress annoying HuggingFace transformers warnings
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Voxora AI",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Global CSS ────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

/* ── Reset & base ── */
*, *::before, *::after { box-sizing: border-box; }

html, body, [data-testid="stApp"] {
    background: #06060f !important;
    font-family: 'Inter', sans-serif;
    color: #e2dff5;
}

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: #0e0e1a; }
::-webkit-scrollbar-thumb { background: #2a2a42; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #7c4ddc; }

/* hide streamlit chrome */
#MainMenu, footer, header,
[data-testid="stToolbar"],
[data-testid="stDecoration"] { display: none !important; }

/* ── Layout ── */
.block-container {
    padding: 2rem 2.5rem 4rem !important;
    max-width: 900px !important;
}

/* ════════════════════════════════════
   SIDEBAR
════════════════════════════════════ */
[data-testid="stSidebar"] {
    background: #0a0a18 !important;
    border-right: 1px solid #1a1a2e !important;
}
[data-testid="stSidebar"] > div:first-child {
    padding: 1.5rem 1.2rem !important;
}

.sidebar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 0 20px;
    border-bottom: 1px solid #1a1a2e;
    margin-bottom: 24px;
}
.sidebar-brand-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #7c4ddc, #1ec8a8);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
}
.sidebar-brand-text {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: #f0edff;
    letter-spacing: -0.01em;
}
.sidebar-brand-sub {
    font-size: 12px;
    color: #4a4870;
    letter-spacing: 0.05em;
    margin-top: 1px;
}

.key-section {
    margin-bottom: 20px;
}
.key-section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}
.key-badge {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 20px;
    font-family: 'JetBrains Mono', monospace;
}
.key-badge.groq {
    background: rgba(30, 200, 168, 0.12);
    color: #1ec8a8;
    border: 1px solid rgba(30, 200, 168, 0.25);
}
.key-badge.mistral {
    background: rgba(124, 77, 220, 0.12);
    color: #a07af5;
    border: 1px solid rgba(124, 77, 220, 0.25);
}
.key-label {
    font-size: 14px;
    font-weight: 600;
    color: #c8c4e0;
    font-family: 'Space Grotesk', sans-serif;
}
.key-model {
    font-size: 12px;
    color: #3e3c5e;
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 8px;
    padding-left: 2px;
}

/* sidebar inputs */
[data-testid="stSidebar"] [data-testid="stTextInput"] > div > div > input {
    background: #0e0e1c !important;
    border: 1px solid #222238 !important;
    border-radius: 8px !important;
    color: #ddd9f0 !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 14px !important;
    padding: 0 12px !important;
    height: 44px !important;
    transition: border-color 0.2s !important;
}
[data-testid="stSidebar"] [data-testid="stTextInput"] > div > div > input:focus {
    border-color: #7c4ddc !important;
    box-shadow: 0 0 0 3px rgba(124,77,220,0.1) !important;
}
[data-testid="stSidebar"] [data-testid="stTextInput"] label {
    display: none !important;
}

.key-status {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
    margin-top: 5px;
    padding-left: 2px;
}
.key-status.set { color: #1ec8a8; }
.key-status.unset { color: #3e3c5e; }
.key-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
}
.key-dot.set { background: #1ec8a8; box-shadow: 0 0 4px rgba(30,200,168,0.5); }
.key-dot.unset { background: #2a2a42; }

.sidebar-divider {
    border: none;
    border-top: 1px solid #1a1a2e;
    margin: 20px 0;
}

.sidebar-info {
    background: rgba(124,77,220,0.06);
    border: 1px solid rgba(124,77,220,0.15);
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 13px;
    color: #5e5c80;
    line-height: 1.65;
}
.sidebar-info strong { color: #7c4ddc; }

/* ════════════════════════════════════
   HERO
════════════════════════════════════ */
.hero {
    padding: 36px 0 28px;
    border-bottom: 1px solid #131324;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
}
.hero::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 260px; height: 260px;
    background: radial-gradient(circle, rgba(124,77,220,0.07) 0%, transparent 70%);
    pointer-events: none;
}
.hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #7c4ddc;
    border: 1px solid rgba(124,77,220,0.28);
    padding: 5px 14px;
    border-radius: 20px;
    margin-bottom: 18px;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
}
.hero-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #7c4ddc;
    box-shadow: 0 0 6px rgba(124,77,220,0.7);
    animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
}
.hero-title {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 800;
    font-size: clamp(26px, 3.8vw, 42px);
    letter-spacing: -0.04em;
    line-height: 1.08;
    color: #f0edff;
    margin-bottom: 12px;
}
.hero-title .accent { color: #7c4ddc; }
.hero-title .accent2 { color: #1ec8a8; }
.hero-sub {
    font-size: 15px;
    color: #3e3c5e;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}
.hero-pill {
    background: #0e0e1c;
    border: 1px solid #1a1a2e;
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 13px;
    color: #5e5c80;
}


.field-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #3e3c5e;
    margin-bottom: 10px;
    display: block;
    font-family: 'Inter', sans-serif;
}

/* main text input */
[data-testid="stTextInput"] > div > div > input {
    background: #08080f !important;
    border: 1px solid #1e1e30 !important;
    border-radius: 8px !important;
    color: #ddd9f0 !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 14px !important;
    padding: 0 14px !important;
    height: 46px !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
}
[data-testid="stTextInput"] > div > div > input:focus {
    border-color: #7c4ddc !important;
    box-shadow: 0 0 0 3px rgba(124,77,220,0.12) !important;
}
[data-testid="stTextInput"] label { display: none !important; }

/* selectbox */
[data-testid="stSelectbox"] > div > div {
    background: #08080f !important;
    border: 1px solid #1e1e30 !important;
    border-radius: 8px !important;
    color: #ddd9f0 !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 14px !important;
    min-height: 46px !important;
    display: flex !important;
    align-items: center !important;
}
[data-testid="stSelectbox"] label { display: none !important; }

/* radio */
[data-testid="stRadio"] > div {
    gap: 10px !important;
    flex-direction: row !important;
}
[data-testid="stRadio"] label {
    font-family: 'Inter', sans-serif !important;
    font-size: 15px !important;
    font-weight: 500 !important;
    color: #5e5c80 !important;
    cursor: pointer !important;
    transition: color 0.15s !important;
}
[data-testid="stRadio"] label:has(input:checked) {
    color: #e2dff5 !important;
}
[data-testid="stRadio"] > label { display: none !important; }

/* file uploader */
[data-testid="stFileUploader"] > label { display: none !important; }
[data-testid="stFileUploaderDropzone"] {
    background: #08080f !important;
    border: 1px dashed #1e1e30 !important;
    border-radius: 8px !important;
    padding: 20px !important;
    transition: border-color 0.2s !important;
}
[data-testid="stFileUploaderDropzone"]:hover {
    border-color: rgba(124,77,220,0.35) !important;
}
[data-testid="stFileUploaderDropzone"] p {
    color: #3e3c5e !important;
    font-size: 15px !important;
}

/* ════════════════════════════════════
   BUTTONS
════════════════════════════════════ */
.stButton > button {
    background: linear-gradient(135deg, #7c4ddc 0%, #6b3bc9 100%) !important;
    color: #fff !important;
    border: none !important;
    border-radius: 9px !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    letter-spacing: 0.04em !important;
    padding: 0 24px !important;
    height: 46px !important;
    cursor: pointer !important;
    transition: all 0.2s !important;
    width: 100% !important;
    box-shadow: 0 4px 16px rgba(124,77,220,0.25) !important;
}
.stButton > button:hover {
    background: linear-gradient(135deg, #9462f0 0%, #7c4ddc 100%) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 24px rgba(124,77,220,0.35) !important;
}
.stButton > button:active { transform: translateY(0) !important; }
.stButton > button:disabled {
    background: #141428 !important;
    color: #2a2a42 !important;
    box-shadow: none !important;
    transform: none !important;
}

/* download button */
[data-testid="stDownloadButton"] > button {
    background: transparent !important;
    border: 1px solid #1e1e30 !important;
    color: #5e5c80 !important;
    font-size: 14px !important;
    height: 42px !important;
    letter-spacing: 0.04em !important;
    font-family: 'Inter', sans-serif !important;
    font-weight: 500 !important;
    margin-top: 14px !important;
    box-shadow: none !important;
}
[data-testid="stDownloadButton"] > button:hover {
    border-color: #7c4ddc !important;
    color: #e2dff5 !important;
    background: rgba(124,77,220,0.06) !important;
    transform: none !important;
    box-shadow: none !important;
}

/* ════════════════════════════════════
   STATUS BAR
════════════════════════════════════ */
.status-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    background: #0a0a16;
    border: 1px solid #131324;
    border-radius: 10px;
    margin-bottom: 24px;
    font-size: 14px;
    color: #3e3c5e;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
}
.status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}
.status-dot.idle    { background: #2a2a42; }
.status-dot.active  {
    background: #1ec8a8;
    box-shadow: 0 0 8px rgba(30,200,168,0.6);
    animation: pulse 1.4s ease-in-out infinite;
}
.status-dot.done    { background: #7c4ddc; box-shadow: 0 0 8px rgba(124,77,220,0.6); }
.status-label { color: #9e9ab8; }

/* ════════════════════════════════════
   STATS ROW
════════════════════════════════════ */
.stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 28px;
}
.stat-card {
    background: #0a0a16;
    border: 1px solid #131324;
    border-radius: 12px;
    padding: 18px 22px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
}
.stat-card:hover { border-color: #2a2a42; }
.stat-card::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,77,220,0.2), transparent);
}
.stat-icon {
    font-size: 20px;
    margin-bottom: 10px;
    opacity: 0.7;
}
.stat-value {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 800;
    font-size: 30px;
    color: #7c4ddc;
    letter-spacing: -0.03em;
    line-height: 1;
}
.stat-value.teal { color: #1ec8a8; }
.stat-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #3e3c5e;
    margin-top: 6px;
}

/* ════════════════════════════════════
   RESULT TITLE BLOCK
════════════════════════════════════ */
.result-header {
    padding: 22px 24px;
    border: 1px solid #131324;
    border-radius: 12px;
    margin-bottom: 24px;
    background: #0a0a16;
    position: relative;
    overflow: hidden;
}
.result-header::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #7c4ddc 0%, #1ec8a8 60%, transparent 100%);
}
.result-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #7c4ddc;
    margin-bottom: 8px;
    font-family: 'Inter', sans-serif;
}
.result-title {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 800;
    font-size: clamp(20px, 2.8vw, 28px);
    color: #f0edff;
    letter-spacing: -0.03em;
    line-height: 1.25;
}

/* ════════════════════════════════════
   TABS
════════════════════════════════════ */
[data-testid="stTabs"] [role="tablist"] {
    gap: 0 !important;
    border-bottom: 1px solid #131324 !important;
    background: transparent !important;
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
}
[data-testid="stTabs"] button[role="tab"] {
    font-family: 'Space Grotesk', sans-serif !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    letter-spacing: 0.04em !important;
    color: #3e3c5e !important;
    background: transparent !important;
    border: none !important;
    padding: 12px 18px !important;
    border-bottom: 2px solid transparent !important;
    margin-bottom: -1px !important;
    transition: color 0.15s !important;
}
[data-testid="stTabs"] button[role="tab"]:hover {
    color: #9e9ab8 !important;
}
[data-testid="stTabs"] button[role="tab"][aria-selected="true"] {
    color: #e2dff5 !important;
    border-bottom-color: #7c4ddc !important;
}
[data-testid="stTabContent"] { padding-top: 22px !important; }

/* ════════════════════════════════════
   CARDS & CONTENT BLOCKS
════════════════════════════════════ */
.content-card {
    background: #0a0a16;
    border: 1px solid #131324;
    border-radius: 12px;
    padding: 24px 26px;
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
    font-size: 16px;
    line-height: 1.9;
    color: #aca8c8;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'Inter', sans-serif;
}

/* ════════════════════════════════════
   LIST ITEMS
════════════════════════════════════ */
.item-list { list-style: none; padding: 0; margin: 0; }
.item-list li {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 15px 0;
    border-bottom: 1px solid #0e0e1c;
    font-size: 15px;
    color: #aca8c8;
    line-height: 1.75;
    font-family: 'Inter', sans-serif;
    transition: color 0.15s;
}
.item-list li:hover { color: #c8c4e0; }
.item-list li:last-child { border-bottom: none; padding-bottom: 0; }
.item-num {
    flex-shrink: 0;
    min-width: 26px; height: 26px;
    background: rgba(124,77,220,0.1);
    border: 1px solid rgba(124,77,220,0.2);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    font-weight: 800;
    color: #7c4ddc;
    font-family: 'Space Grotesk', sans-serif;
    margin-top: 2px;
}
.empty-state {
    padding: 32px 0;
    text-align: center;
    font-size: 15px;
    color: #1e1e2e;
    font-style: italic;
}

/* ════════════════════════════════════
   CHAT
════════════════════════════════════ */
.chat-container {
    background: #08080f;
    border: 1px solid #111120;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
}
.chat-history {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 420px;
    overflow-y: auto;
    padding: 4px 2px;
}
.chat-msg {
    max-width: 88%;
    padding: 14px 18px;
    border-radius: 10px;
    font-size: 15px;
    line-height: 1.75;
    font-family: 'Inter', sans-serif;
    position: relative;
}
.chat-msg.user {
    align-self: flex-end;
    background: rgba(124,77,220,0.14);
    border: 1px solid rgba(124,77,220,0.2);
    color: #e2dff5;
    border-bottom-right-radius: 3px;
}
.chat-msg.bot {
    align-self: flex-start;
    background: #0e0e1c;
    border: 1px solid #1a1a2e;
    color: #aca8c8;
    border-bottom-left-radius: 3px;
}
.chat-role {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 5px;
    opacity: 0.4;
    font-family: 'Inter', sans-serif;
}
.chat-hint {
    text-align: center;
    padding: 24px 0;
    font-size: 15px;
    color: #1e1e2e;
    font-family: 'Inter', sans-serif;
    line-height: 1.7;
}
.chat-input-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 12px;
}

/* ════════════════════════════════════
   PROGRESS STEPS
════════════════════════════════════ */
.step-list { list-style: none; padding: 6px 0; margin: 0; }
.step-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 0;
    font-size: 15px;
    color: #1e1e2e;
    border-bottom: 1px solid #0a0a14;
    transition: color 0.2s;
    font-family: 'Inter', sans-serif;
}
.step-item:last-child { border-bottom: none; }
.step-item.done  { color: #1ec8a8; }
.step-item.active { color: #e2dff5; font-weight: 600; }
.step-icon { font-size: 18px; width: 24px; text-align: center; flex-shrink: 0; }
.step-check {
    color: #1ec8a8;
    font-weight: 700;
    font-size: 16px;
}

/* ════════════════════════════════════
   SECTION HEADER
════════════════════════════════════ */
.sec-head {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px;
}
.sec-icon {
    width: 32px; height: 32px;
    background: rgba(124,77,220,0.1);
    border: 1px solid rgba(124,77,220,0.18);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
}
.sec-title {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: #c8c4e0;
    letter-spacing: -0.01em;
}

/* ── alerts ── */
[data-testid="stAlert"] {
    background: #0a0a16 !important;
    border: 1px solid #1e1e30 !important;
    border-radius: 8px !important;
    color: #7e7a9e !important;
    font-size: 14px !important;
    font-family: 'Inter', sans-serif !important;
}

/* ── spinner ── */
[data-testid="stSpinner"] { color: #7c4ddc !important; }

/* ── empty state ── */
.empty-hero {
    text-align: center;
    padding: 60px 0 40px;
}
.empty-hero-icon {
    font-size: 56px;
    opacity: 0.06;
    margin-bottom: 18px;
    display: block;
}
.empty-hero-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #1e1e2e;
    letter-spacing: -0.02em;
    margin-bottom: 10px;
}
.empty-hero-sub {
    font-size: 15px;
    color: #16162a;
    line-height: 1.8;
}
.empty-hero-sub strong { color: #7c4ddc; }

/* ── pipeline progress card ── */
.progress-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #3e3c5e;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Inter', sans-serif;
}
.progress-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #0e0e1c;
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

# ── Sidebar for API Keys ──────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div class="sidebar-brand">
        <div class="sidebar-brand-icon">🎬</div>
        <div>
            <div class="sidebar-brand-text">Voxora AI</div>
            <div class="sidebar-brand-sub">POWERED BY GROQ &amp; MISTRAL</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ── Groq Key ──
    st.markdown("""
    <div class="key-section">
        <div class="key-section-header">
            <span class="key-badge groq">GROQ</span>
            <span class="key-label">Transcription Key</span>
        </div>
        <div class="key-model">▸ whisper-large-v3</div>
    </div>
    """, unsafe_allow_html=True)
    groq_api_key = st.text_input("Groq API Key", type="password",
                                  placeholder="gsk_...",
                                  help="Used for ultra-fast Whisper transcription via Groq Cloud.")
    if groq_api_key:
        os.environ["GROQ_API_KEY"] = groq_api_key
        st.markdown('<div class="key-status set"><span class="key-dot set"></span>Key saved for this session</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="key-status unset"><span class="key-dot unset"></span>Not configured</div>', unsafe_allow_html=True)

    st.markdown("<hr class='sidebar-divider'>", unsafe_allow_html=True)

    # ── Mistral Key ──
    st.markdown("""
    <div class="key-section">
        <div class="key-section-header">
            <span class="key-badge mistral">MISTRAL</span>
            <span class="key-label">AI Analysis Key</span>
        </div>
        <div class="key-model">▸ mistral-medium-latest</div>
    </div>
    """, unsafe_allow_html=True)
    mistral_api_key = st.text_input("MistralAI API Key", type="password",
                                     placeholder="...",
                                     help="Used for summaries, action items, decisions, and RAG Q&A chat.")
    if mistral_api_key:
        os.environ["MISTRALAI_API_KEY"] = mistral_api_key
        st.markdown('<div class="key-status set"><span class="key-dot set"></span>Key saved for this session</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="key-status unset"><span class="key-dot unset"></span>Not configured</div>', unsafe_allow_html=True)

    st.markdown("<hr class='sidebar-divider'>", unsafe_allow_html=True)

    st.markdown("""
    <div class="sidebar-info">
        🔒 Keys are stored <strong>only in memory</strong> for the current session and never persisted.
    </div>
    """, unsafe_allow_html=True)


# ── Helpers ───────────────────────────────────────────────────────────────────



def run_pipeline_ui(source: str, language: str = "auto") -> dict:
    from utils.audio_processor import process_input
    from core.transcriber import transcribe_all
    from core.summarize import summarize, generate_title
    from core.extractor import extract_actionable_items, extract_key_decisions, extract_questions, extract_mindmap
    from core.rag_engine import build_rag_chain

    STEPS = [
        ("🔊", "Processing audio / video source"),
        ("📝", "Transcribing with Whisper"),
        ("🏷️", "Generating title"),
        ("📋", "Summarising content"),
        ("✅", "Extracting action items"),
        ("🔑", "Extracting key decisions"),
        ("❓", "Extracting open questions"),
        ("🗺️", "Generating mind map"),
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
                cls, ico = "", f'<span class="step-icon" style="opacity:.2">{icon}</span>'
            rows += f'<li class="step-item {cls}">{ico}<span>{label}</span></li>'

        ph.markdown(f"""
        <div class="content-card" style="margin-bottom:0">
            <div class="progress-label">Pipeline Progress</div>
            <ul class="step-list">{rows}</ul>
        </div>""", unsafe_allow_html=True)

    draw(0)
    chunks = process_input(source);           draw(1)
    transcript = transcribe_all(chunks, language=language);      draw(2)
    title = generate_title(transcript);       draw(3)
    summary = summarize(transcript);          draw(4)
    action_items = extract_actionable_items(transcript); draw(5)
    key_decisions = extract_key_decisions(transcript);   draw(6)
    questions = extract_questions(transcript);           draw(7)
    mindmap = extract_mindmap(summary);                  draw(8)
    rag_chain = build_rag_chain(transcript);             draw(9)

    ph.empty()

    return dict(
        title=title, summary=summary,
        action_items=action_items, key_decisions=key_decisions,
        questions=questions, mindmap=mindmap, rag_chain=rag_chain, transcript=transcript,
    )


# ════════════════════════════════════════════════════════════════════════════════
# HERO
# ════════════════════════════════════════════════════════════════════════════════
st.markdown("""
<div class="hero">
    <div class="hero-eyebrow"><span class="hero-dot"></span>Voxora AI · Video Intelligence</div>
    <div class="hero-title">Turn any video into<br><span class="accent">structured</span> <span class="accent2">intelligence</span></div>
    <div class="hero-sub">
        <span class="hero-pill">🎥 YouTube URLs</span>
        <span class="hero-pill">📁 Local files</span>
        <span class="hero-pill">💬 Instant RAG chat</span>
    </div>
</div>
""", unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════════════════════════
# INPUT SECTION
# ════════════════════════════════════════════════════════════════════════════════
with st.container():

    col_type, col_lang = st.columns(2)
    with col_type:
        st.markdown('<span class="field-label">Source type</span>', unsafe_allow_html=True)
        source_type = st.radio(
            "source_type", ["YouTube URL", "Local file"],
            horizontal=True, label_visibility="collapsed",
        )
    with col_lang:
        st.markdown('<span class="field-label">Language</span>', unsafe_allow_html=True)
        language_map = {"Auto-Detect": "auto", "Hindi": "hi", "English": "en"}
        selected_lang_name = st.selectbox(
            "language", list(language_map.keys()),
            label_visibility="collapsed"
        )
        selected_language = language_map[selected_lang_name]

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

# ── Trigger pipeline ──────────────────────────────────────────────────────────
if analyze and source_value:
    st.session_state.processing = True
    st.session_state.pipeline_result = None
    st.session_state.pipeline_error = None
    st.session_state.chat_history = []
    try:
        result = run_pipeline_ui(source_value, language=selected_language)
        st.session_state.pipeline_result = result
    except Exception as e:
        st.session_state.pipeline_error = str(e)
    finally:
        st.session_state.processing = False
    st.rerun()


# ── Status bar ────────────────────────────────────────────────────────────────
if st.session_state.processing:
    dot, msg = "active", "Processing…"
elif st.session_state.pipeline_result:
    dot, msg = "done", "Analysis complete"
elif st.session_state.get("pipeline_error"):
    dot, msg = "idle", "Analysis failed"
else:
    dot, msg = "idle", "Awaiting input"

st.markdown(f"""
<div class="status-bar">
    <span class="status-dot {dot}"></span>
    <span class="status-label">{msg}</span>
</div>
""", unsafe_allow_html=True)

if st.session_state.get("pipeline_error"):
    st.error(f"Pipeline error: {st.session_state.pipeline_error}")


# ════════════════════════════════════════════════════════════════════════════════
# RESULTS
# ════════════════════════════════════════════════════════════════════════════════
if st.session_state.pipeline_result is None and not st.session_state.processing:
    st.markdown("""
    <div class="empty-hero">
        <span class="empty-hero-icon">🎬</span>
        <div class="empty-hero-title">No analysis yet</div>
        <div class="empty-hero-sub">
            Paste a YouTube URL or upload a video file,<br>
            then hit <strong>Analyze Video</strong> to get started.
        </div>
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
            <div class="stat-icon">📝</div>
            <div class="stat-value">{word_count:,}</div>
            <div class="stat-label">Words transcribed</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">💬</div>
            <div class="stat-value teal">{qa_turns}</div>
            <div class="stat-label">Q&amp;A turns</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ── title ──
    st.markdown(f"""
    <div class="result-header">
        <div class="result-eyebrow">✦ Detected Title</div>
        <div class="result-title">{r['title']}</div>
    </div>
    """, unsafe_allow_html=True)

    # ── tabs ──
    tab_s, tab_a, tab_d, tab_q, tab_m, tab_c, tab_t = st.tabs([
        "📋 Summary", "✅ Actions", "🔑 Decisions",
        "❓ Questions", "🗺️ Mind Map", "💬 Chat", "📄 Transcript",
    ])

    # Summary
    with tab_s:
        with st.container(border=True):
            st.markdown(r['summary'])

    # Actions
    with tab_a:
        st.markdown("""
        <div class="sec-head">
            <div class="sec-icon">✅</div>
            <div class="sec-title">Action Items</div>
        </div>""", unsafe_allow_html=True)
        with st.container(border=True):
            st.markdown(r["action_items"] if r["action_items"] else "No action items identified.")

    # Decisions
    with tab_d:
        st.markdown("""
        <div class="sec-head">
            <div class="sec-icon">🔑</div>
            <div class="sec-title">Key Decisions</div>
        </div>""", unsafe_allow_html=True)
        with st.container(border=True):
            st.markdown(r["key_decisions"] if r["key_decisions"] else "No key decisions found.")

    # Questions
    with tab_q:
        st.markdown("""
        <div class="sec-head">
            <div class="sec-icon">❓</div>
            <div class="sec-title">Open Questions</div>
        </div>""", unsafe_allow_html=True)
        with st.container(border=True):
            st.markdown(r["questions"] if r["questions"] else "No open questions found.")

    # Mind Map
    with tab_m:
        st.markdown("""
        <div class="sec-head">
            <div class="sec-icon">🗺️</div>
            <div class="sec-title">Visual Mind Map</div>
        </div>""", unsafe_allow_html=True)
        with st.container(border=True):
            if r["mindmap"]:
                clean_code = r["mindmap"].replace("```mermaid", "").replace("```", "").strip()
                
                clean_lines = []
                for i, line in enumerate(clean_code.split('\n')):
                    if not line.strip() or line.strip().lower() == 'mindmap':
                        clean_lines.append(line)
                        continue
                    indent = len(line) - len(line.lstrip())
                    text = line.strip()
                    if '((' in text and '))' in text:
                        clean_lines.append(line)  # Already has a shape
                    else:
                        if text.startswith('"') and text.endswith('"'):
                            text = text[1:-1]
                        text = text.replace('`', "'")
                        clean_lines.append(" " * indent + f'n{i}["`{text}`"]')
                clean_code = '\n'.join(clean_lines)
                
                html_code = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {{
                            background-color: transparent;
                            margin: 0;
                            padding: 20px;
                        }}
                        .mermaid {{
                            display: flex;
                            justify-content: center;
                            min-width: max-content;
                        }}
                        .mermaid svg {{
                            max-width: 100% !important;
                            height: auto !important;
                            min-width: 600px !important;
                        }}
                    </style>
                    <script type="module">
                        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
                        mermaid.initialize({{ startOnLoad: false, theme: 'dark' }});
                        mermaid.run({{ querySelector: '.mermaid' }}).catch(err => {{
                            const el = document.querySelector('.mermaid');
                            el.innerHTML = '<div style="color:#ff4b4b;font-family:sans-serif;background:#2a0000;padding:10px;border-radius:5px;"><b>Mermaid Syntax Error:</b><br>' + err.message + '</div><pre style="color:#fff">' + el.textContent + '</pre>';
                        }});
                    </script>
                </head>
                <body>
                    <div class="mermaid">
{clean_code}
                    </div>
                </body>
                </html>
                """
                import base64
                b64_html = base64.b64encode(html_code.encode("utf-8")).decode("utf-8")
                st.markdown(
                    f'<iframe src="data:text/html;base64,{b64_html}" width="100%" height="800px" style="border:none;" scrolling="yes"></iframe>', 
                    unsafe_allow_html=True
                )
            else:
                st.markdown("No mind map generated.")

    # Chat
    with tab_c:
        st.markdown("""
        <div class="sec-head">
            <div class="sec-icon">💬</div>
            <div class="sec-title">Chat with your video</div>
        </div>""", unsafe_allow_html=True)

        if st.session_state.chat_history:
            with st.container(height=400):
                for m in st.session_state.chat_history:
                    role = "assistant" if m["role"] == "bot" else m["role"]
                    with st.chat_message(role):
                        st.markdown(m["content"])
        else:
            st.markdown("""
            <div class="chat-hint">
                Ask anything about the video — decisions, context, follow-ups…
            </div>""", unsafe_allow_html=True)

        c1, c2 = st.columns([5, 1])
        with c1:
            user_q = st.text_input(
                "q", placeholder="e.g. What were the main blockers?",
                label_visibility="collapsed", key="chat_input",
            )
        with c2:
            send = st.button("Send →", key="send_btn")

        if send and user_q.strip():
            from core.rag_engine import ask_question
            q = user_q.strip()
            st.session_state.chat_history.append({"role": "user", "content": q})
            with st.spinner("Thinking…"):
                ans = ask_question(r["rag_chain"], q)
            st.session_state.chat_history.append({"role": "bot", "content": ans})
            st.rerun()

        if st.session_state.chat_history:
            if st.button("↺ Clear chat", key="clear_chat"):
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
            <div class="card-text" style="max-height:480px;overflow-y:auto;
                 font-size:13px;line-height:1.85;font-family:'JetBrains Mono',monospace;">{tx}</div>
        </div>""", unsafe_allow_html=True)
        st.download_button(
            "⬇  Download transcript (.txt)",
            data=tx, file_name="transcript.txt", mime="text/plain",
        )