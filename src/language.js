export function languageFromText(text = '') {
  const value = text.toLowerCase();
  if (/双语|中英|简英|繁英|chs.*eng|cht.*eng|bilingual/.test(value)) return 'zho';
  if (/繁体|繁體|cht|big5|traditional/.test(value)) return 'zht';
  if (/简体|簡體|chs|gb|simplified|中文|chi/.test(value)) return 'zhs';
  if (/英语|英語|english|\beng\b/.test(value)) return 'eng';
  return 'zho';
}

export function isTextSubtitle(text = '') {
  return /(?:\bsrt\b|subrip|\bass\b|\bssa\b|webvtt|\bvtt\b)/i.test(text);
}
