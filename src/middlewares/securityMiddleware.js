import { logSecurityEvent } from '../utils/securityLogger.js';

// ── LOG ALL REQUESTS ─────────────────────────────────
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'CRITICAL'
                : res.statusCode >= 400 ? 'WARN'
                : 'INFO';

    logSecurityEvent({
      level,
      type:     'HTTP_REQUEST',
      message:  `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
      ip:       req.ip,
      endpoint: req.originalUrl,
      method:   req.method,
      userAgent: req.headers['user-agent'],
      metadata: {
        statusCode: res.statusCode,
        duration,
        userId: req.user?._id || null,
      }
    });
  });

  next();
};

// ── DETECT SUSPICIOUS PATTERNS ───────────────────────
export const suspiciousActivityDetector = (req, res, next) => {
  const suspicious = [
    // NoSQL injection attempts (belt + suspenders after mongoSanitize)
    /\$where/i,
    /\$regex/i,
    /\$gt.*\$lt/i,
    // XSS patterns
    /<script/i,
    /javascript:/i,
    // Path traversal
    /\.\.\//,
    /\.\.%2f/i,
  ];

  const body   = JSON.stringify(req.body || {});
  const query  = JSON.stringify(req.query || {});
  const params = JSON.stringify(req.params || {});
  const payload = `${body}${query}${params}`;

  for (const pattern of suspicious) {
    if (pattern.test(payload)) {
      logSecurityEvent({
        level:    'CRITICAL',
        type:     'SUSPICIOUS_REQUEST',
        message:  `Suspicious pattern detected: ${pattern}`,
        ip:       req.ip,
        endpoint: req.originalUrl,
        method:   req.method,
        userAgent: req.headers['user-agent'],
        metadata: { pattern: pattern.toString(), payload: payload.slice(0, 200) }
      });

      // ✅ Block the request
      return res.status(400).json({
        success: false,
        message: 'Invalid request detected',
      });
    }
  }

  next();
};