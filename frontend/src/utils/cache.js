// Simple localStorage cache with optional TTL (milliseconds)
const PREFIX = 'workhub_cache_v1:';

function _key(key) {
  return PREFIX + key;
}

export function setCached(key, value, ttl = 1000 * 60 * 5) { // default 5 minutes
  try {
    const payload = { value, ts: Date.now(), ttl };
    localStorage.setItem(_key(key), JSON.stringify(payload));
  } catch (e) {
    console.warn('Failed to set cache', e);
  }
}

export function getCached(key) {
  try {
    const raw = localStorage.getItem(_key(key));
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object') return null;
    if (payload.ttl && Date.now() - payload.ts > payload.ttl) {
      localStorage.removeItem(_key(key));
      return null;
    }
    return payload.value;
  } catch (e) {
    console.warn('Failed to read cache', e);
    return null;
  }
}

export async function getOrFetch(key, fetcher, ttl) {
  const cached = getCached(key);
  if (cached) return cached;
  const fresh = await fetcher();
  setCached(key, fresh, ttl);
  return fresh;
}

export function clearCache(key) {
  try { localStorage.removeItem(_key(key)); } catch (e) { console.debug('clearCache failed', e); }
}

export default { getCached, setCached, getOrFetch, clearCache };
