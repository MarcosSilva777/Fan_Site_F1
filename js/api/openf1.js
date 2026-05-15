import { getCache, setCache } from '../utils/cache.js';

const BASE_URL = 'https://api.openf1.org/v1';
const TTL = 1000 * 60 * 30;

async function request(path) {
  const cacheKey = `openf1::${path}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`OpenF1 API ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  setCache(cacheKey, data, TTL);
  return data;
}

export async function getDriversForSession(sessionKey) {
  return request(`/drivers?session_key=${sessionKey}`);
}

export async function getLatestSession() {
  const data = await request(`/sessions?session_key=latest`);
  return data?.[0] ?? null;
}

export async function getSessionsByYear(year) {
  return request(`/sessions?year=${year}`);
}

export async function getMeetingsByYear(year) {
  return request(`/meetings?year=${year}`);
}
