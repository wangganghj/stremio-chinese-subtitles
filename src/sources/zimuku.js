import * as cheerio from 'cheerio';
import { config } from '../config.js';
import { firstWorking, request } from '../http.js';
import { isTextSubtitle, languageFromText } from '../language.js';

export async function searchZimuku(query) {
  const { base, response } = await firstWorking(config.zimukuBases, () => `/search?q=${encodeURIComponent(query)}`);
  const $ = cheerio.load(await response.text());
  const results = [];
  $('a[href*="/detail/"], a[href*="/subs/"]').each((_, node) => {
    const href = $(node).attr('href');
    const title = $(node).text().replace(/\s+/g, ' ').trim();
    if (!href || !title || results.some((x) => x.key === new URL(href, base).href)) return;
    const context = $(node).closest('tr,li,.item,.media').text();
    if (context && !isTextSubtitle(context)) return;
    results.push({ source: 'zimuku', key: new URL(href, base).href, lang: languageFromText(context), title });
  });
  return results.slice(0, config.limit);
}

export async function resolveZimuku(detailUrl) {
  const $ = cheerio.load(await (await request(detailUrl)).text());
  const link = $('a[href*="/dld/"], a[href*="download"], a[href$=".srt"], a[href$=".ass"], a[href$=".zip"]').first();
  if (!link.length) throw new Error('字幕库详情页未找到下载链接（页面结构可能已更新）');
  return { downloadUrl: new URL(link.attr('href'), detailUrl).href, filename: link.text().trim() };
}
