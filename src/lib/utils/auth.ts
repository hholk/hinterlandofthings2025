import { browser } from '$app/environment';

// Für Einsteiger:innen: Wir speichern nur den Hash, nie das Klartext-Passwort.
export const AUTH_COOKIE_NAME = 'auth-token';
export const PASSWORD_HASH = '911bb9317e2ce5b62399efddb2d3abc16e5c047862019054d956416920bc979b';

export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== 'string') {
    throw new TypeError('Password must be a string');
  }

  if (browser && crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return bufferToHex(buffer);
  }

  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(password).digest('hex');
}

export async function verifyPassword(password: string, expectedHash: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return timingSafeEqual(hash, expectedHash);
}

function timingSafeEqual(hash: string, expected: string): boolean {
  if (hash.length !== expected.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < hash.length; i += 1) {
    result |= hash.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return result === 0;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
