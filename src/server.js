import express from 'express';
import { config } from './config.js';
import { parseExtra, queryFromRequest } from './query.js';
import { searchAssrt, resolveAssrt } from './sources/assrt.js';
import { searchZimuku, resolveZimuku } from './sources/zimuku.js';
import { searchSubhd, resolveSubhd } from './sources/subhd.js';
import { fetchSubtitle } from './subtitle.js';

const app = express();
const manifest = {
  id: 'community.chinese.multi-subtitles',
  version: '0.1.0',
  name: '中文多站字幕',
  description: '聚合 ASSRT、字幕库和 SubHD 的简体、繁体及双语字幕',
  resources: ['subtitles'],
  types: ['movie', 'series'],
  catalogs: [],
  idPrefixes: ['tt']
};

app.get('/manifest.json', (_req, res) => res.json(manifest));

async function subtitlesHandler(req, res) {
  const query = queryFromRequest(req.params.id, parseExtra(req.params.extra));
  const settled = await Promise.allSettled([searchAssrt(query), searchZimuku(query), searchSubhd(query)]);
  const results = settled.flatMap((x) => x.status === 'fulfilled' ? x.value : []);
  const subtitles = results.map((item, index) => ({
    id: `${item.source}-${index}-${Buffer.from(item.key).toString('base64url')}`,
    lang: item.lang,
    url: `${config.publicUrl}/subtitle/${item.source}/${Buffer.from(item.key).toString('base64url')}.srt`,
    name: `[${item.source.toUpperCase()}] ${item.title}`
  }));
  res.set('cache-control', 'public, max-age=300').json({ subtitles });
}

app.get('/subtitles/:type/:id/:extra.json', subtitlesHandler);
app.get('/subtitles/:type/:id.json', subtitlesHandler);

app.get('/subtitle/:source/:key.:ext', async (req, res, next) => {
  try {
    const key = Buffer.from(req.params.key, 'base64url').toString();
    const resolved = req.params.source === 'assrt' ? await resolveAssrt(key)
      : req.params.source === 'zimuku' ? await resolveZimuku(key)
      : req.params.source === 'subhd' ? await resolveSubhd(key)
      : null;
    if (!resolved) return res.status(404).send('Unknown source');
    const subtitle = resolved.body ? resolved : await fetchSubtitle(resolved);
    res.type(subtitle.extension === 'vtt' ? 'text/vtt' : 'text/plain').send(subtitle.body);
  } catch (error) { next(error); }
});

app.get('/', (_req, res) => res.type('html').send(`<meta charset="utf-8"><h1>${manifest.name}</h1><p>安装地址：<a href="${config.publicUrl}/manifest.json">${config.publicUrl}/manifest.json</a></p><p>ASSRT：${config.assrtToken ? '已配置' : '未配置 Token'}；字幕库、SubHD：已启用</p>`));
app.use((error, _req, res, _next) => res.status(502).json({ error: error.message }));

app.listen(config.port, () => console.log(`Stremio addon: ${config.publicUrl}/manifest.json`));
