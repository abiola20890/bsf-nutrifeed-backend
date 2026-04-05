import NodeCache from 'node-cache';

// ── CACHE INSTANCE ───────────────────────────────────
// stdTTL: default time-to-live (in seconds)
// checkperiod: how often expired keys are removed
const cache = new NodeCache({
  stdTTL: 60,          // default: 1 minute
  checkperiod: 120,    // cleanup every 2 minutes
  useClones: false,    // better performance (important)
});


// ✅ Helper to clear all keys matching a prefix
export const clearCacheByPrefix = (prefix) => {
  const keys = cache.keys();
  const matched = keys.filter(k => k.startsWith(prefix));
  matched.forEach(k => cache.del(k));
};

export default cache;