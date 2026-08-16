import path from 'node:path';
import iconv from 'iconv-lite';
import unzipper from 'unzipper';
import { request } from './http.js';

const supported = /\.(srt|ass|ssa|vtt)$/i;

function decode(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return iconv.decode(buffer, 'utf16-le');
  if (buffer[0] === 0xfe && buffer[1] === 0xff) return iconv.decode(buffer, 'utf16-be');
  const utf8 = iconv.decode(buffer, 'utf8');
  return utf8.includes('\uFFFD') ? iconv.decode(buffer, 'gb18030') : utf8;
}

export async function fetchSubtitle({ downloadUrl, filename }) {
  const response = await request(downloadUrl, { headers: { referer: new URL(downloadUrl).origin } });
  const buffer = Buffer.from(await response.arrayBuffer());
  const disposition = response.headers.get('content-disposition') || '';
  const actualName = filename || decodeURIComponent(disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i)?.[1] || '') || new URL(response.url).pathname;
  const type = response.headers.get('content-type') || '';
  if (/zip/i.test(type) || /\.zip$/i.test(actualName) || buffer.subarray(0, 2).equals(Buffer.from('PK'))) {
    const archive = await unzipper.Open.buffer(buffer);
    const entry = archive.files.filter((x) => supported.test(x.path) && x.type === 'File').sort((a, b) => a.path.length - b.path.length)[0];
    if (!entry) throw new Error('ZIP 内没有 Stremio 支持的文本字幕');
    return { body: decode(await entry.buffer()), extension: path.extname(entry.path).slice(1).toLowerCase() };
  }
  if (/\.(rar|7z)$/i.test(actualName) || buffer.subarray(0, 4).toString('hex') === '52617221') {
    throw new Error('当前仅能自动解压 ZIP；该字幕站返回了 RAR/7z');
  }
  return { body: decode(buffer), extension: path.extname(actualName).slice(1).toLowerCase() || 'srt' };
}
