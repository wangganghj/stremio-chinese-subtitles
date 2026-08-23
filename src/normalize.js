/**
 * Standardizes time in milliseconds to SRT format: HH:MM:SS,mmm
 */
export function formatSrtTime(ms) {
  const value = Math.max(0, Math.round(ms));
  const hours = Math.floor(value / 3600000);
  const minutes = Math.floor((value % 3600000) / 60000);
  const seconds = Math.floor((value % 60000) / 1000);
  const millis = value % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

/**
 * Parses timestamp string (SRT, VTT, or ASS) to milliseconds.
 */
export function parseTimestamp(str) {
  if (!str) return null;
  const match = str.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/);
  if (!match) return null;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const millisStr = (match[4] || '0').padEnd(3, '0').slice(0, 3);
  const millis = Number(millisStr);
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
}

/**
 * Cleans formatting tags (ASS tags like {\pos(1,2)}, HTML tags, and literal \N / \n).
 */
export function cleanSubtitleText(rawText) {
  if (!rawText) return '';
  return String(rawText)
    // Remove ASS drawing commands
    .replace(/\{\\p[1-9]\}.*?\{\\p0\}/gs, '')
    // Remove ASS override tags
    .replace(/\{[^}]*\}/g, '')
    // Replace ASS line break tokens with standard newlines
    .replace(/\\N/gi, '\n')
    .replace(/\\n/gi, '\n')
    .replace(/\\h/gi, ' ')
    // Remove HTML tags while preserving text
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    // Remove preview truncation dots on their own line
    .replace(/^\s*\.{3,}\s*$/gm, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line !== '...')
    .join('\n');
}

/**
 * Converts ASS / SSA subtitle format to standard SRT cues.
 */
export function assToCues(content) {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  let inEvents = false;
  let formatCols = ['layer', 'start', 'end', 'style', 'name', 'marginl', 'marginr', 'marginv', 'effect', 'text'];
  const cues = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^\[Events\]/i.test(line)) {
      inEvents = true;
      continue;
    }
    if (/^\[.*\]/.test(line)) {
      inEvents = false;
      continue;
    }
    if (!inEvents) continue;

    if (/^Format:/i.test(line)) {
      formatCols = line.replace(/^Format:\s*/i, '').split(',').map((c) => c.trim().toLowerCase());
      continue;
    }

    if (/^Dialogue:/i.test(line)) {
      const body = line.replace(/^Dialogue:\s*/i, '');
      const numCols = formatCols.length;
      const rawParts = body.split(',');
      if (rawParts.length < numCols) continue;

      const parts = rawParts.slice(0, numCols - 1);
      parts.push(rawParts.slice(numCols - 1).join(','));

      const startIdx = formatCols.indexOf('start');
      const endIdx = formatCols.indexOf('end');
      const textIdx = formatCols.indexOf('text');

      const startStr = parts[startIdx >= 0 ? startIdx : 1];
      const endStr = parts[endIdx >= 0 ? endIdx : 2];
      const textRaw = parts[textIdx >= 0 ? textIdx : parts.length - 1];

      const startMs = parseTimestamp(startStr);
      const endMs = parseTimestamp(endStr);
      const text = cleanSubtitleText(textRaw);

      if (startMs != null && endMs != null && endMs > startMs && text) {
        cues.push({ startMs, endMs, text });
      }
    }
  }

  return cues;
}

/**
 * Robustly parses SRT / VTT or mixed timestamped text into cue objects.
 */
export function textToCues(content) {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const timestampRegex = /(?:^|\n)\s*(?:(\d+)\s*\n)?\s*((?:(?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3}))\s*-->\s*((?:(?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3}))[^\n]*\n([\s\S]*?)(?=(?:\n\s*(?:\d+\s*\n)?\s*(?:(?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3})\s*-->)|$)/g;
  
  const cues = [];
  let match;
  while ((match = timestampRegex.exec(normalized)) !== null) {
    const startStr = match[2];
    const endStr = match[3];
    let rawText = match[4] || '';

    // Strip trailing cue index of the next cue if it got caught in rawText
    rawText = rawText.replace(/\n\s*\d+\s*$/, '');

    const startMs = parseTimestamp(startStr);
    const endMs = parseTimestamp(endStr);
    const text = cleanSubtitleText(rawText);

    if (startMs != null && endMs != null && endMs > startMs && text) {
      cues.push({ startMs, endMs, text });
    }
  }

  return cues;
}

/**
 * Formats an array of cues into strictly-valid SRT format with consecutive integer positions.
 */
export function formatCuesToSrt(cues) {
  if (!cues || cues.length === 0) return '';
  // Sort chronologically by start time
  const sorted = [...cues].sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  return sorted.map((cue, index) => {
    return `${index + 1}\n${formatSrtTime(cue.startMs)} --> ${formatSrtTime(cue.endMs)}\n${cue.text}`;
  }).join('\n\n') + '\n';
}

/**
 * Universal subtitle normalizer: takes any subtitle text/format and returns 100% valid SRT.
 */
export function normalizeToSrt(rawContent, formatHint = '') {
  if (!rawContent) return '';
  const text = String(rawContent).replace(/^\uFEFF/, '').trim();
  if (!text) return '';

  const isAss = formatHint === 'ass' || formatHint === 'ssa' || /\[Script Info\]|\[Events\]/i.test(text);
  let cues = isAss ? assToCues(text) : textToCues(text);

  // If initial cue parsing yielded nothing (e.g. formatHint was wrong or non-standard), try the other method
  if (cues.length === 0) {
    cues = isAss ? textToCues(text) : assToCues(text);
  }

  return formatCuesToSrt(cues);
}
