import crypto from 'crypto';

// Check integrity of data using SHA-256 hash
export const generateChecksum = (data) => {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
};

export const verifyChecksum = (data, checksum) => {
  return generateChecksum(data) === checksum;
};