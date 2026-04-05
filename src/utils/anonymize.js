// ── ANONYMIZE EMAIL ──────────────────────────────────
export const anonymizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '***';

  const parts = email.split('@');
  if (parts.length !== 2) return '***'; // invalid email

  const [local, domain] = parts;

  if (local.length <= 2) {
    return `***@${domain}`;
  }

  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
};


// ── ANONYMIZE NAME ───────────────────────────────────
export const anonymizeName = (name) => {
  if (!name || typeof name !== 'string') return '***';

  const parts = name.trim().split(/\s+/);

  return parts
    .map((part, index) => {
      if (!part) return '';
      return index === 0 ? part : `${part[0].toUpperCase()}.`;
    })
    .join(' ');
};


// ── ANONYMIZE IP (IPv4 + IPv6 SAFE) ──────────────────
export const anonymizeIP = (ip) => {
  if (!ip || typeof ip !== 'string') return '***';

  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.*`;
    }
  }

  // IPv6 (mask last segments)
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + '::****';
  }

  return '***';
};


// ── ANONYMIZE FULL USER OBJECT ───────────────────────
export const anonymizeUser = (user) => {
  if (!user || typeof user !== 'object') return null;

  return {
    ...user,
    email: anonymizeEmail(user.email),
    name: anonymizeName(user.name),
  };
};


// ── OPTIONAL: SAFE AUDIT LOG ANONYMIZER ──────────────
export const anonymizeAuditLog = (log) => {
  if (!log || typeof log !== 'object') return null;

  return {
    ...log,
    ipAddress: anonymizeIP(log.ipAddress),
    user: log.user ? anonymizeUser(log.user) : null,
  };
};