const noise = /\b(2160p|1080p|720p|480p|bluray|web[- .]?dl|webrip|hdtv|x26[45]|h\.?26[45]|hevc|avc|hdr|dv|remux|aac\d?(?:\.\d)?|ddp?\d?(?:\.\d)?|dts(?:-hd)?|atmos)\b/gi;

export function queryFromRequest(id, extra = {}) {
  const filename = String(extra.filename || '').replace(/\.(mkv|mp4|avi|mov|m4v|ts)$/i, '');
  const videoId = String(extra.videoID || extra.videoId || id);
  let query = filename || videoId.split(':')[0];
  query = query.replace(noise, ' ').replace(/[._]+/g, ' ').replace(/\[[^\]]*]/g, ' ').replace(/\s+/g, ' ').trim();
  const season = extra.season || videoId.split(':')[1];
  const episode = extra.episode || videoId.split(':')[2];
  if (!filename && season && episode) query += ` S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
  return query;
}

export function parseExtra(segment = '') {
  return Object.fromEntries(new URLSearchParams(segment.replace(/\.json$/, '').replace(/;/g, '&')));
}
