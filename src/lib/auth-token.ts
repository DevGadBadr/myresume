import { createHmac, timingSafeEqual } from 'node:crypto';

function hmacSha256(secret: string, value: string) {
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function safeTokenEqual(secret: string, left: string, right: string) {
  const leftBuffer = Buffer.from(hmacSha256(secret, left));
  const rightBuffer = Buffer.from(hmacSha256(secret, right));
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(secret: string, username: string, expiresAt: number) {
  const payload = `${username}:${expiresAt}`;
  const signature = hmacSha256(secret, payload);
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export function verifySessionToken(secret: string, token: string) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [username, expiresAtRaw, signature] = decoded.split(':');

    if (!username || !expiresAtRaw || !signature) {
      return false;
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return false;
    }

    const expectedSignature = hmacSha256(secret, `${username}:${expiresAt}`);
    return safeTokenEqual(secret, signature, expectedSignature);
  } catch {
    return false;
  }
}
