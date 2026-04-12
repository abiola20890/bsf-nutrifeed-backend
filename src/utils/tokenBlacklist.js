// In-memory blacklist — tokens invalidated on logout
// In production upgrade to Redis for persistence across restarts
const blacklist = new Set();

export const blacklistToken = (token) => {
  blacklist.add(token);

  // ✅ Auto-clean expired tokens every hour
  setTimeout(() => {
    blacklist.delete(token);
  }, 15 * 60 * 1000); // 15 minutes = access token lifetime
};

export const isBlacklisted = (token) => {
  return blacklist.has(token);
};