function csv(name, fallback) {
  return (process.env[name] || fallback).split(',').map((x) => x.trim().replace(/\/$/, '')).filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 7000),
  publicUrl: (process.env.PUBLIC_URL || `http://127.0.0.1:${process.env.PORT || 7000}`).replace(/\/$/, ''),
  timeout: Number(process.env.REQUEST_TIMEOUT_MS || 10000),
  limit: Math.min(15, Math.max(1, Number(process.env.RESULTS_PER_SOURCE || 10))),
  assrtToken: process.env.ASSRT_TOKEN || '',
  zimukuBases: csv('ZIMUKU_BASE_URLS', 'https://zimuku.org,https://srtku.com'),
  subhdBases: csv('SUBHD_BASE_URLS', 'https://subhd.tv,https://subhd.me,https://subhd.one,https://subhd.cc')
};
