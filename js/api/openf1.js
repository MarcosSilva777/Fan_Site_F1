import { getCache, setCache } from '../utils/cache.js';
import { fetchJson } from './http.js';

const BASE_URL = 'https://api.openf1.org/v1';
const TTL = 1000 * 60 * 30;
const TTL_LIVE = 1000 * 8;

async function request(path, { ttl = TTL } = {}) {
  const cacheKey = `openf1::${path}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const data = await fetchJson(`${BASE_URL}${path}`);
  setCache(cacheKey, data, ttl);
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

export async function getPositionsForSession(sessionKey) {
  const rows = await request(`/position?session_key=${sessionKey}`, { ttl: TTL_LIVE });
  if (!Array.isArray(rows)) return [];

  const latestByDriver = new Map();
  for (const row of rows) {
    const current = latestByDriver.get(row.driver_number);
    if (!current || new Date(row.date) > new Date(current.date)) {
      latestByDriver.set(row.driver_number, row);
    }
  }

  return Array.from(latestByDriver.values()).sort(
    (a, b) => (a.position ?? 99) - (b.position ?? 99)
  );
}
