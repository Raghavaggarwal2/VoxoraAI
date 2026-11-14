import React, { useEffect, useRef, useState, useId } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Check,
  AlertTriangle,
  Move,
} from 'lucide-react';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { useTheme } from '../../context/ThemeContext';

export default function MermaidViewer({ chartCode }) {
  const containerRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0 });
  const uniqueId = useId().replace(/:/g, '_');
  const { theme } = useTheme();

  const [svgContent, setSvgContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (!chartCode || !chartCode.trim()) {
      setSvgContent('');
      setError('No mind map definition available for this media.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Dynamic import to optimize chunking
    import('mermaid')
      .then(({ default: mermaid }) => {
        if (isCancelled) return;

        const isDark = theme === 'dark';

        // Vibrant, high-contrast Coastal Navy branch palette
        // Guarantees every branch is distinct, colorful, and never washes out on light or dark canvas
        const branchColors = [
          '#0284c7', // 0: Ocean Blue
          '#059669', // 1: Emerald Green
          '#7c3aed', // 2: Violet / Purple
          '#d97706', // 3: Amber / Warm Gold
          '#0d9488', // 4: Teal
          '#e11d48', // 5: Rose / Crimson
          '#4f46e5', // 6: Indigo
          '#0ea5e9', // 7: Sky Blue
          '#ea580c', // 8: Sunset Orange
          '#10b981', // 9: Vibrant Mint
          '#9333ea', // 10: Deep Purple
          '#db2777', // 11: Ruby Pink
        ];

        const cScaleVars = {};
        branchColors.forEach((color, i) => {
          cScaleVars[`cScale${i}`] = color;
          cScaleVars[`cScaleLabel${i}`] = '#ffffff';
          cScaleVars[`cScaleInv${i}`] = color;
        });

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'loose',
          mindmap: {
            padding: 20,
            useMaxWidth: false,
          },
          themeVariables: {
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            darkMode: isDark,
            background: 'transparent',
            mainBkg: isDark ? '#1e293b' : '#0f172a',
            textColor: '#ffffff',
            lineColor: isDark ? '#38bdf8' : '#0284c7',
            nodeBorder: isDark ? '#38bdf8' : '#0284c7',

            // Root node: Deep Navy with Ocean Blue stroke
            git0: isDark ? '#1e293b' : '#0f172a',
            gitBranchLabel0: '#ffffff',

            ...cScaleVars,
          },
          themeCSS: `
            /* Modern Coastal Navy Mindmap Theme */
            .mindmap-node rect,
            .mindmap-node path,
            .mindmap-node circle,
            .mindmap-node polygon {
              rx: 8px !important;
              ry: 8px !important;
              stroke-width: 1.5px !important;
              filter: drop-shadow(0 2px 4px rgba(15, 23, 42, 0.12)) !important;
            }
            .mindmap-node text,
            .mindmap-node tspan,
            .mindmap-node span {
              font-family: Inter, system-ui, -apple-system, sans-serif !important;
              font-weight: 600 !important;
              letter-spacing: -0.01em !important;
              fill: #ffffff !important;
              color: #ffffff !important;
            }
            .section-root rect,
            .section-root path,
            .section-root circle,
            .section-root polygon {
              rx: 12px !important;
              ry: 12px !important;
              fill: ${isDark ? '#1e293b' : '#0f172a'} !important;
              stroke: ${isDark ? '#38bdf8' : '#0284c7'} !important;
              stroke-width: 2.5px !important;
              filter: drop-shadow(0 4px 12px rgba(2, 132, 199, 0.28)) !important;
            }
            .section-root text,
            .section-root tspan,
            .section-root span {
              font-weight: 700 !important;
              font-size: 15px !important;
              fill: #ffffff !important;
              color: #ffffff !important;
            }
            .edge,
            path[class*="section-edge-"],
            line[class*="section-edge-"] {
              stroke-linecap: round !important;
              stroke-linejoin: round !important;
              opacity: 0.9 !important;
            }
            /* Explicit section color rules: ensures every branch is vibrant and never washed out */
            ${branchColors
              .map(
                (color, i) => `
              .section-${i} rect, .section-${i} path, .section-${i} circle, .section-${i} polygon {
                fill: ${color} !important;
                stroke: ${color} !important;
              }
              .section-${i} text, .section-${i} tspan, .section-${i} span {
                fill: #ffffff !important;
                color: #ffffff !important;
              }
              .section-edge-${i} {
                stroke: ${color} !important;
              }
            `
              )
              .join('\n')}
          `,
        });

        const renderId = `mermaid_diagram_${uniqueId}_${Date.now()}`;
        // Heal any double-wrapped nodes: n1["`root["..."]`"] -> root["..."]
        const sanitizedCode = chartCode
          .trim()
          .replace(/n\d+\["`\s*([a-zA-Z0-9_-]+\[".*?"\])\s*`"\]/g, '$1');
        return mermaid.render(renderId, sanitizedCode);
      })
      .then((res) => {
        if (!isCancelled && res?.svg) {
          setSvgContent(res.svg);
          setError(null);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err?.message || 'Failed to render Mermaid diagram.');
          setSvgContent('');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [chartCode, theme, uniqueId]);

  // Zoom controls
  const handleZoomIn = () => setScale((s) => Math.min(2.5, s + 0.2));
  const handleZoomOut = () => setScale((s) => Math.max(0.4, s - 0.2));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!dragRef.current.isDragging) return;
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY,
    });
  };

  const handleMouseUp = () => {
    dragRef.current = {
      isDragging: false,
    };
  };

  const handleCopyCode = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(chartCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-sans">
          <Move className="w-3.5 h-3.5" />
          <span>Click &amp; drag to pan canvas</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-md border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-md border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-md border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors"
            title="Reset Fit (100%)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-300 dark:bg-navy-700 mx-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied' : 'Copy Code'}
          </Button>
        </div>
      </div>

      {/* ── Interactive Mind Map Canvas ──────────────────────────────────────── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-[560px] rounded-2xl border border-slate-200 dark:border-navy-700 bg-slate-50/60 dark:bg-navy-950 overflow-hidden relative select-none cursor-grab active:cursor-grabbing flex items-center justify-center p-4 shadow-inner"
        style={{
          backgroundImage:
            theme === 'dark'
              ? 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 1.2px, transparent 1.2px)'
              : 'radial-gradient(circle, rgba(148, 163, 184, 0.28) 1.2px, transparent 1.2px)',
          backgroundSize: '20px 20px',
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <Spinner size="md" color="ocean" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Loading mind map visualization...
            </p>
          </div>
        ) : error ? (
          <div className="max-w-md p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Diagram Rendering Notice
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The visual renderer encountered unexpected syntax in the mind map definition. You can view and copy the raw definition below.
              </p>
            </div>
            <pre className="p-3 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-[11px] font-mono text-left text-slate-800 dark:text-slate-200 overflow-x-auto max-h-48">
              {chartCode}
            </pre>
          </div>
        ) : svgContent ? (
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: dragRef.current.isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="flex items-center justify-center pointer-events-none"
          />
        ) : (
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-sans">
            No mind map data to display.
          </div>
        )}
      </div>
    </div>
  );
}
