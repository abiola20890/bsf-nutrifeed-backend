import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const logsDir    = path.join(__dirname, '../../logs');
const secLogPath = path.join(logsDir, 'security.log');

// ✅ Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ── SECURITY EVENT LOGGER ────────────────────────────
export const logSecurityEvent = (event) => {
  const entry = {
    timestamp:  new Date().toISOString(),
    level:      event.level || 'INFO',
    type:       event.type,
    message:    event.message,
    ip:         event.ip || 'unknown',
    userId:     event.userId || null,
    endpoint:   event.endpoint || null,
    method:     event.method || null,
    userAgent:  event.userAgent || null,
    metadata:   event.metadata || null,
  };

  const line = JSON.stringify(entry) + '\n';

  // ✅ Write to security log file
  fs.appendFileSync(secLogPath, line);

  // ✅ Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    const color = entry.level === 'CRITICAL' ? '\x1b[31m'
                : entry.level === 'WARN'     ? '\x1b[33m'
                : '\x1b[32m';
    console.log(`${color}[SECURITY] ${entry.level}: ${entry.message}\x1b[0m`);
  }
};

// ── CONVENIENCE METHODS ──────────────────────────────
export const logCritical = (type, message, meta = {}) =>
  logSecurityEvent({ level: 'CRITICAL', type, message, ...meta });

export const logWarn = (type, message, meta = {}) =>
  logSecurityEvent({ level: 'WARN', type, message, ...meta });

export const logInfo = (type, message, meta = {}) =>
  logSecurityEvent({ level: 'INFO', type, message, ...meta });


export const ALERT_THRESHOLDS = {
  FAILED_LOGINS_PER_HOUR:    10,
  REQUESTS_PER_MINUTE:       60,
  SUSPICIOUS_PATTERNS:        1, // immediate alert
  PAYLOAD_SIZE_VIOLATIONS:    3,
};

// ── ALERT TRACKER ────────────────────────────────────
const alertCounters = new Map();

export const trackAlert = (type, identifier) => {
  const key = `${type}:${identifier}`;
  const now = Date.now();
  const record = alertCounters.get(key) || { count: 0, firstSeen: now };

  if (now - record.firstSeen > 60 * 60 * 1000) {
    alertCounters.set(key, { count: 1, firstSeen: now });
    return false;
  }

  record.count += 1;
  alertCounters.set(key, record);

  const threshold = ALERT_THRESHOLDS[type] || 5;
  if (record.count >= threshold) {
    logCritical('THRESHOLD_EXCEEDED', `Alert: ${type} threshold exceeded`, {
      identifier,
      count: record.count,
      threshold,
    });
    return true; // alert triggered
  }

  return false;
};