// utils/auditLogger.js
import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({
  user,
  action,
  resource,
  resourceId,
  changes = null,
  description = '',
  req = null,
  status = 'success',
}) => {
  try {
    await AuditLog.create({
      user,
      action,
      resource,
      resourceId,
      changes,
      description,
      method: req?.method,
      endpoint: req?.originalUrl,
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'],
      status,
    });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
};