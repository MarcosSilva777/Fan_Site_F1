const DEFAULT_TIMEOUT = 8000;
const DEFAULT_RETRIES = 2;
const DEFAULT_BACKOFF = 600;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpError(message, { kind, status } = {}) {
  const err = new Error(message);
  err.kind = kind;
  if (status != null) err.status = status;
  return err;
}

async function fetchWithTimeout(url, { timeoutMs, headers } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { Accept: 'application/json', ...headers },
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw httpError(`Tempo esgotado ao acessar ${url}`, { kind: 'timeout' });
    }
    throw httpError(err.message || 'Falha de rede', { kind: 'network' });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson(
  url,
  {
    timeoutMs = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    backoff = DEFAULT_BACKOFF,
    headers,
  } = {}
) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { timeoutMs, headers });

      if (res.ok) {
        return res.json();
      }

      if (res.status >= 400 && res.status < 500) {
        throw httpError(`HTTP ${res.status}: ${res.statusText}`, {
          kind: 'http',
          status: res.status,
        });
      }

      lastError = httpError(`HTTP ${res.status}: ${res.statusText}`, {
        kind: 'http',
        status: res.status,
      });
    } catch (err) {
      if (err.kind === 'http' && err.status >= 400 && err.status < 500) {
        throw err;
      }
      lastError = err;
    }

    if (attempt < retries) {
      await delay(backoff * 2 ** attempt);
    }
  }

  throw lastError ?? httpError(`Falha ao acessar ${url}`, { kind: 'network' });
}
