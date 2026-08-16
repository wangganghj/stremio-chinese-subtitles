import * as cheerio from 'cheerio';
import { config } from '../config.js';
import { firstWorking, request } from '../http.js';
import { languageFromText } from '../language.js';

export async function searchSubhd(query) {
  const { base, response } = await firstWorking(config.subhdBases, () => `/search/${encodeURIComponent(query)}`);
  const $ = cheerio.load(await response.text());
  const results = [];
  $('a[href^="/a/"]').each((_, node) => {
    const href = $(node).attr('href');
    const title = $(node).text().replace(/\s+/g, ' ').trim();
    if (!href || !title || results.some((x) => x.key === new URL(href, base).href)) return;
    const context = $(node).closest('div,li,tr').text();
    results.push({ source: 'subhd', key: new URL(href, base).href, lang: languageFromText(context), title });
  });
  return results.slice(0, config.limit);
}

export async function resolveSubhd(detailUrl) {
  const response = await request(detailUrl);
  const $ = cheerio.load(await response.text());
  const previewPath = $('#subtitleFilePreview').attr('data-preview-url');
  if (!previewPath) throw new Error('SubHD 未提供匿名预览接口，可能需要登录或完成人机验证');
  const previewUrl = new URL(previewPath, response.url);
  previewUrl.searchParams.set('manifest', '1');
  const data = await (await request(previewUrl, {
    headers: { referer: response.url, 'x-requested-with': 'XMLHttpRequest', accept: 'application/json' }
  })).json();
  if (!data.success || !data.file?.content) throw new Error(data.message || 'SubHD 字幕预览不可用');
  return { body: previewToSrt(data.file.content), extension: 'srt' };
}

export function previewToSrt(content) {
  const blocks = String(content).replace(/\r/g, '').split(/(?=\[\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?])/)
    .map((block) => {
      const match = block.match(/^\[(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?]\s*\n?([\s\S]*?)\s*$/);
      if (!match) return null;
      const ms = ((Number(match[1]) * 60 + Number(match[2])) * 60 + Number(match[3])) * 1000 + Number((match[4] || '').padEnd(3, '0'));
      return { ms, text: match[5].trim() };
    }).filter((x) => x?.text);
  const stamp = (ms) => {
    const value = Math.max(0, ms);
    const hours = Math.floor(value / 3600000);
    const minutes = Math.floor(value % 3600000 / 60000);
    const seconds = Math.floor(value % 60000 / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(value % 1000).padStart(3, '0')}`;
  };
  return blocks.map((item, index) => {
    const next = blocks[index + 1]?.ms;
    const end = next == null ? item.ms + 5000 : Math.max(item.ms + 500, next - 100);
    return `${index + 1}\n${stamp(item.ms)} --> ${stamp(end)}\n${item.text}`;
  }).join('\n\n');
}
