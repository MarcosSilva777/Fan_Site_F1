const CACHE_PREFIX = 'f1fs::';
const STALE_PREFIX = 'f1fs::stale::';
const DEFAULT_TTL = 1000 * 60 * 60;
const STALE_TTL = 1000 * 60 * 60 * 24 * 14;

export function getCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function setCache(key, value, ttl = DEFAULT_TTL) {
  try {
    const entry = { value, expiresAt: Date.now() + ttl };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    localStorage.setItem(
      STALE_PREFIX + key,
      JSON.stringify({ value, expiresAt: Date.now() + STALE_TTL })
    );
  } catch {
    // armazenamento cheio ou indisponível: silenciar
  }
}

export function getStaleCache(key) {
  try {
    const raw = localStorage.getItem(STALE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(STALE_PREFIX + key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function clearCache() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(CACHE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}
