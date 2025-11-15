import { browser } from '$app/environment';

// Für Einsteiger:innen: Wir speichern nur den Hash, nie das Klartext-Passwort.
export const AUTH_COOKIE_NAME = 'auth-token';
// Hash für das Passwort "hinterland2025" – niemals das Klartext-Passwort einchecken.
export const PASSWORD_HASH = 'fd83af4d7dad74cc994fcb0551f6c3070967c53731175d2bf6e62d9b7e626447';

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
