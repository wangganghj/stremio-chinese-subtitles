import { config } from '../config.js';
import { request } from '../http.js';
import { languageFromText } from '../language.js';

export async function searchAssrt(query) {
  if (!config.assrtToken || query.length < 3) return [];
  const url = new URL('https://api.assrt.net/v1/sub/search');
  url.search = new URLSearchParams({ token: config.assrtToken, q: query, cnt: String(config.limit), no_muxer: '1' });
  const data = await (await request(url)).json();
  if (data.status !== 0) throw new Error(data.errmsg || `ASSRT status ${data.status}`);
  return (data.sub?.subs || []).map((item) => ({
    source: 'assrt',
    key: String(item.id),
    lang: languageFromText(`${item.lang?.desc || ''} ${item.subtype || ''}`),
    title: item.videoname || item.native_name || `ASSRT ${item.id}`
  }));
}

export async function resolveAssrt(id) {
  const url = new URL('https://api.assrt.net/v1/sub/detail');
  url.search = new URLSearchParams({ token: config.assrtToken, id });
  const data = await (await request(url)).json();
  if (data.status !== 0) throw new Error(data.errmsg || `ASSRT status ${data.status}`);
  const item = data.sub?.subs?.[0];
  const file = item?.filelist?.find((x) => /\.(srt|ass|ssa|vtt)$/i.test(x.f || ''));
  const downloadUrl = file?.url || item?.url;
  if (!downloadUrl) throw new Error('ASSRT 没有返回下载地址');
  return { downloadUrl, filename: file?.f || item.filename || '' };
}
