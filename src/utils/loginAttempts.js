// Track failed login attempts per email
const attempts = new Map();

const MAX_ATTEMPTS = 5;
const LOCK_TIME    = 15 * 60 * 1000; // 15 minutes

export const recordFailedAttempt = (email) => {
  const now = Date.now();
  const record = attempts.get(email) || { count: 0, firstAttempt: now };

  // Reset if lock time has passed
  if (now - record.firstAttempt > LOCK_TIME) {
    attempts.set(email, { count: 1, firstAttempt: now });
    return false;
  }

  record.count += 1;
  attempts.set(email, record);
  return record.count >= MAX_ATTEMPTS;
};

export const isAccountLocked = (email) => {
  const record = attempts.get(email);
  if (!record) return false;

  const now = Date.now();
  if (now - record.firstAttempt > LOCK_TIME) {
    attempts.delete(email);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
};

export const clearAttempts = (email) => {
  attempts.delete(email);
};