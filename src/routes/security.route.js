import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { addToBlocklist } from '../middlewares/malwareProtection.js';
import { logCritical } from '../utils/securityLogger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const router     = Router();

router.use(protect);
router.use(restrictTo('admin'));

/**
 * @swagger
 * tags:
 *   name: Security
 *   description: Security monitoring and threat management — admin only
 */

/**
 * @swagger
 * /api/v1/security/logs:
 *   get:
 *     summary: View security logs
 *     description: Returns parsed security.log entries. Filter by level and limit number of lines returned. Admin only.
 *     tags: [Security]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [INFO, WARN, CRITICAL]
 *         description: Filter logs by severity level
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 500
 *         description: Number of most recent log lines to return
 *     responses:
 *       200:
 *         description: Security logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 142
 *                         shown:
 *                           type: integer
 *                           example: 50
 *                         logs:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/SecurityLog'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/logs', (req, res, next) => {
  try {
    const { level, lines = 50 } = req.query;
    const logPath = path.join(__dirname, '../../logs/security.log');

    if (!fs.existsSync(logPath)) {
      return successResponse(res, 'No security logs yet', { logs: [] });
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    let logs = content
      .split('\n')
      .filter(Boolean)
      .map(line => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean);

    if (level) {
      logs = logs.filter(log => log.level === level.toUpperCase());
    }

    const recent = logs.slice(-Number(lines)).reverse();

    return successResponse(res, 'Security logs retrieved', {
      total:  logs.length,
      shown:  recent.length,
      logs:   recent,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/security/block-ip:
 *   post:
 *     summary: Block a malicious IP address
 *     description: Adds an IP to the in-memory blocklist for 24 hours. All requests from this IP will be rejected with 403. Admin only.
 *     tags: [Security]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ip]
 *             properties:
 *               ip:
 *                 type: string
 *                 example: 192.168.1.100
 *                 description: IPv4 or IPv6 address to block
 *               reason:
 *                 type: string
 *                 example: Repeated injection attempts
 *                 description: Optional reason for blocking (logged)
 *     responses:
 *       200:
 *         description: IP blocked successfully for 24 hours
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: IP address is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/block-ip', (req, res, next) => {
  try {
    const { ip, reason = 'Manual block by admin' } = req.body;

    if (!ip) {
      return errorResponse(res, 'IP address is required', 400);
    }

    addToBlocklist(ip);

    logCritical('MANUAL_IP_BLOCK', `Admin manually blocked IP: ${ip}`, {
      ip,
      reason,
      blockedBy: req.user._id,
    });

    return successResponse(res, `IP ${ip} blocked for 24 hours`, { ip, reason });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/security/threat-summary:
 *   get:
 *     summary: Get threat summary dashboard
 *     description: Returns counts of CRITICAL, WARN and INFO security events plus the 10 most recent critical threats. Admin only.
 *     tags: [Security]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Threat summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         critical:
 *                           type: integer
 *                           example: 12
 *                           description: Total CRITICAL level events
 *                         warnings:
 *                           type: integer
 *                           example: 34
 *                           description: Total WARN level events
 *                         info:
 *                           type: integer
 *                           example: 256
 *                           description: Total INFO level events
 *                         threats:
 *                           type: array
 *                           description: Last 10 critical threats
 *                           items:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 example: MALWARE_DETECTED
 *                               message:
 *                                 type: string
 *                                 example: Malware pattern detected — XSS_SCRIPT_TAG
 *                               ip:
 *                                 type: string
 *                                 example: 192.168.1.100
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/threat-summary', (req, res, next) => {
  try {
    const logPath = path.join(__dirname, '../../logs/security.log');

    if (!fs.existsSync(logPath)) {
      return successResponse(res, 'No threats detected', {
        critical: 0, warnings: 0, info: 0, threats: []
      });
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    const logs = content
      .split('\n')
      .filter(Boolean)
      .map(line => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean);

    const summary = {
      critical: logs.filter(l => l.level === 'CRITICAL').length,
      warnings: logs.filter(l => l.level === 'WARN').length,
      info:     logs.filter(l => l.level === 'INFO').length,
      threats:  logs
        .filter(l => l.level === 'CRITICAL')
        .slice(-10)
        .reverse()
        .map(l => ({
          type:      l.type,
          message:   l.message,
          ip:        l.ip,
          timestamp: l.timestamp,
        })),
    };

    return successResponse(res, 'Threat summary retrieved', summary);
  } catch (error) {
    next(error);
  }
});

export default router;