import React from 'react';

/**
 * Tokenize and render inline Markdown styles:
 * - ***bold italic***
 * - **bold**
 * - *italic*
 * - `code`
 */
export function renderInlineMarkdown(text) {
  if (!text) return null;

  // Match inline code, bold-italic, bold, or italic
  const tokenRegex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-navy-900 text-ocean-600 dark:text-ocean-400 border border-slate-200 dark:border-navy-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold + Italic: ***bold italic***
    if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
      return (
        <strong key={index} className="font-semibold italic text-slate-900 dark:text-white">
          {part.slice(3, -3)}
        </strong>
      );
    }

    // Bold: **bold**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic: *italic*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-slate-800 dark:text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }

    return part;
  });
}

/**
 * Clean block-level Markdown renderer designed for Voxora AI.
 * Parses headers, unordered/ordered lists, blockquotes, horizontal rules,
 * and paragraphs without leaving raw formatting artifacts (*, **, ###).
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content || !content.trim()) {
    return null;
  }

  const rawLines = content.split(/\r?\n/);
  const blocks = [];
  let currentList = null; // { type: 'ul' | 'ol', items: [] }

  const flushList = () => {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Blank line terminates active list
    if (!trimmed) {
      flushList();
      continue;
    }

    // Horizontal Rule (---, ***, ___)
    if (/^([-*_]){3,}$/.test(trimmed)) {
      flushList();
      blocks.push({ type: 'hr' });
      continue;
    }

    // Headings: # H1, ## H2, ### H3, #### H4
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      continue;
    }

    // Unordered List Items (*, -, •)
    const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered List Items (1., 2., etc.)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push({ num: olMatch[1], text: olMatch[2] });
      continue;
    }

    // Blockquote (> )
    const quoteMatch = trimmed.match(/^>\s*(.+)$/);
    if (quoteMatch) {
      flushList();
      blocks.push({
        type: 'blockquote',
        text: quoteMatch[1],
      });
      continue;
    }

    // Standard Paragraph
    flushList();
    blocks.push({
      type: 'paragraph',
      text: trimmed,
    });
  }
  flushList();

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {blocks.map((block, idx) => {
        // Headings
        if (block.type === 'heading') {
          if (block.level === 1) {
            return (
              <h2
                key={idx}
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pt-3 pb-1 border-b border-slate-200 dark:border-navy-700 first:pt-0"
              >
                {renderInlineMarkdown(block.text)}
              </h2>
            );
          }
          if (block.level === 2) {
            return (
              <h3
                key={idx}
                className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white pt-2.5 pb-0.5 first:pt-0"
              >
                {renderInlineMarkdown(block.text)}
              </h3>
            );
          }
          return (
            <h4
              key={idx}
              className="text-xs sm:text-sm font-semibold text-ocean-700 dark:text-ocean-400 pt-1.5 first:pt-0"
            >
              {renderInlineMarkdown(block.text)}
            </h4>
          );
        }

        // Unordered List
        if (block.type === 'ul') {
          return (
            <ul key={idx} className="space-y-1.5 my-2 pl-0.5">
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-ocean-500 dark:bg-ocean-400 mt-2 shrink-0" />
                  <span className="flex-1">{renderInlineMarkdown(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        // Ordered List
        if (block.type === 'ol') {
          return (
            <ol key={idx} className="space-y-1.5 my-2 pl-0.5">
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  <span className="font-mono text-xs font-semibold text-ocean-600 dark:text-ocean-400 w-5 shrink-0 pt-0.5 text-right">
                    {item.num}.
                  </span>
                  <span className="flex-1">{renderInlineMarkdown(item.text)}</span>
                </li>
              ))}
            </ol>
          );
        }

        // Blockquote
        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={idx}
              className="pl-3.5 py-1.5 border-l-2 border-ocean-500 dark:border-ocean-400 bg-slate-50 dark:bg-navy-900/50 text-xs sm:text-sm text-slate-600 dark:text-slate-400 italic rounded-r my-2"
            >
              {renderInlineMarkdown(block.text)}
            </blockquote>
          );
        }

        // Horizontal Rule
        if (block.type === 'hr') {
          return <hr key={idx} className="border-t border-slate-200 dark:border-navy-700 my-4" />;
        }

        // Standard Paragraph
        return (
          <p
            key={idx}
            className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
          >
            {renderInlineMarkdown(block.text)}
          </p>
        );
      })}
    </div>
  );
}

