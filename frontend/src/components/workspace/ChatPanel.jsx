import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { api } from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import { dataRepository } from '../../database/data.repository';

const STARTER_PROMPTS = [
  'What are the key takeaways from this discussion?',
  'List all action items mentioned with their assignees.',
  'What were the primary decisions made?',
  'What risks or unresolved concerns were raised?',
];

export default function ChatPanel({ jobId, analysisId, workspaceId: propWorkspaceId }) {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = propWorkspaceId || activeWorkspace?.id;
  const effectiveAnalysisId = analysisId || jobId;

  const defaultWelcome = {
    id: 'welcome',
    role: 'assistant',
    text: 'Hello! I am your AI research assistant for this media session. Ask me anything grounded in the speech transcript.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState([defaultWelcome]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const chatEndRef = useRef(null);

  // ── Load Encrypted Messages from Dexie ──────────────────────────────────────

  const loadHistory = useCallback(async () => {
    if (!effectiveAnalysisId || !workspaceId) return;

    try {
      const savedMessages = await dataRepository.getDecryptedChatMessages(
        effectiveAnalysisId,
        workspaceId
      );
      if (savedMessages && savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        setMessages([defaultWelcome]);
      }
    } catch (err) {
      console.warn('Could not read encrypted chat history:', err);
      setMessages([defaultWelcome]);
    }
  }, [effectiveAnalysisId, workspaceId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  // ── Send Message & Persist Encrypted ────────────────────────────────────────

  const handleSend = async (queryText) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isSubmitting) return;

    setError(null);
    setInputQuery('');

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSubmitting(true);

    // Save user message encrypted locally
    if (workspaceId && effectiveAnalysisId) {
      try {
        await dataRepository.saveEncryptedChatMessage(effectiveAnalysisId, workspaceId, userMessage);
      } catch (saveErr) {
        console.warn('Could not encrypt user chat message:', saveErr);
      }
    }

    try {
      const response = await api.askQuestion(jobId, q, {
        workspace_id: workspaceId,
        analysis_id: effectiveAnalysisId,
      });

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: response.answer,
        sources: response.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message with sources encrypted locally
      if (workspaceId && effectiveAnalysisId) {
        try {
          await dataRepository.saveEncryptedChatMessage(
            effectiveAnalysisId,
            workspaceId,
            assistantMessage
          );
        } catch (saveErr) {
          console.warn('Could not encrypt assistant chat message:', saveErr);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve answer from vector knowledge base.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyText = (id, text) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const toggleSourceExpansion = (msgId) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleClear = async () => {
    if (workspaceId && effectiveAnalysisId) {
      try {
        await dataRepository.clearChatMessages(effectiveAnalysisId, workspaceId);
      } catch (err) {
        console.warn('Could not clear local chat messages:', err);
      }
    }

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: 'Conversation history cleared. Ask a new question grounded in the transcript.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-[600px] rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 overflow-hidden shadow-sm">
      {/* ── Top Chat Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-ocean-100 dark:bg-navy-800 text-ocean-700 dark:text-ocean-300 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              Grounded Media RAG Assistant
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              ChromaDB session vector collection &bull; Encrypted chat
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          title="Clear chat history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear History</span>
        </button>
      </div>

      {/* ── Messages Feed ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const hasSources = !isUser && msg.sources && msg.sources.length > 0;
          const isExpanded = Boolean(expandedSources[msg.id]);

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-2xl ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                  isUser
                    ? 'bg-ocean-600 text-white'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className="space-y-1 max-w-[85%]">
                <div
                  className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-ocean-600 text-white rounded-tr-none whitespace-pre-wrap'
                      : 'bg-slate-100 dark:bg-navy-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-navy-700 rounded-tl-none'
                  }`}
                >
                  {isUser ? msg.text : <MarkdownRenderer content={msg.text} />}

                  {/* Grounded Context Sources Accordion */}
                  {hasSources && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-navy-750">
                      <button
                        type="button"
                        onClick={() => toggleSourceExpansion(msg.id)}
                        className="w-full flex items-center justify-between text-[11px] font-semibold text-ocean-600 dark:text-ocean-400 hover:text-ocean-700 dark:hover:text-ocean-300 select-none py-0.5"
                      >
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" />
                          <span>Referenced Context ({msg.sources.length} passages)</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-ocean-300 dark:border-ocean-700 animate-in fade-in duration-100">
                          {msg.sources.map((src, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-white/70 dark:bg-navy-950/40 p-2 rounded-lg border border-slate-200/60 dark:border-navy-800"
                            >
                              &ldquo;{src}&rdquo;
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div
                  className={`flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 px-1 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && msg.id !== 'welcome' && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isSubmitting && (
          <div className="flex items-start gap-2.5 mr-auto max-w-2xl">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3.5 rounded-xl rounded-tl-none bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Spinner size="xs" color="ocean" />
              <span>Retrieving transcript context and generating answer...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Suggested Starter Questions ──────────────────────────────────────── */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-slate-200 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-900/40 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 shrink-0">
            Suggested:
          </span>
          {STARTER_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSend(prompt)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:border-ocean-300 dark:hover:border-navy-600 hover:text-ocean-600 transition-colors shrink-0 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* ── Chat Input Bar ──────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ask a question about the audio/video content..."
            className="flex-1 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-ocean-600 transition-colors disabled:opacity-60"
          />

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!inputQuery.trim() || isSubmitting}
            isLoading={isSubmitting}
            aria-label="Send question"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
