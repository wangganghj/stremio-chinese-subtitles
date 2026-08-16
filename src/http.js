import { config } from './config.js';

const headers = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.7'
};

export async function request(url, options = {}) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(config.timeout),
    ...options,
    headers: { ...headers, ...options.headers }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response;
}

export async function firstWorking(bases, buildPath) {
  const errors = [];
  for (const base of bases) {
    try {
      const response = await request(`${base}${buildPath(base)}`);
      return { base, response };
    } catch (error) {
      errors.push(`${base}: ${error.message}`);
    }
  }
  throw new Error(errors.join('; '));
}
