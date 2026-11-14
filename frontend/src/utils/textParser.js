/**
 * Coastal Navy Structured Intelligence Text Parser.
 *
 * Extracts clean item lists from AI markdown outputs for:
 * - Action Items
 * - Key Decisions
 * - Open Questions
 *
 * Automatically filters out negative placeholder replies like:
 * "No action items found.", "No key decisions found.", "None", "N/A"
 * so that counts remain accurate (0 items) and proper empty states are shown.
 */

const EMPTY_PATTERNS = [
  /^no\s+(actionable\s+)?(action\s+items?|tasks?)\s+(found|identified|mentioned|recorded|noted)/i,
  /^no\s+(key\s+)?decisions?\s+(found|identified|made|logged|recorded|taken|noted)/i,
  /^no\s+(open\s+)?questions?\s+(found|identified|recorded|raised|asked|needing\s+follow-?up)/i,
  /^there\s+(are|were)\s+no\s+(action|decision|question|task)/i,
  /^none(\s+found|\s+identified|\s+recorded)?\.?$/i,
  /^n\/a\.?$/i,
  /^not\s+applicable\.?$/i,
  /^nothing\s+(found|decisive|actionable)/i,
];

export function parseListItems(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // If the whole text or its stripped version matches a negative pattern
  const stripped = trimmed.replace(/^(\d+[\.\)]|[-*•]|\s*\[[ xX]\])\s*/, '').trim();
  if (EMPTY_PATTERNS.some((p) => p.test(stripped))) {
    return [];
  }

  const rawLines = trimmed
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsed = [];
  for (const line of rawLines) {
    // Strip markdown numbering (1.), bullets (*, -, •), or checkbox ([ ], [x])
    const cleaned = line.replace(/^(\d+[\.\)]|[-*•]|\s*\[[ xX]\])\s*/, '').trim();

    if (!cleaned) continue;

    // Skip conversational intros or headers
    if (
      /^(here\s+(are|is)\s+(the\s+)?(action\s+items|decisions|questions|tasks)|action\s+items?:|key\s+decisions?:|open\s+questions?:)/i.test(
        cleaned
      )
    ) {
      continue;
    }

    // Skip individual empty indicator lines
    if (EMPTY_PATTERNS.some((p) => p.test(cleaned))) {
      continue;
    }

    parsed.push(cleaned);
  }

  return parsed;
}

