import { describe, expect, it } from 'vitest';
import { PASSWORD_HASH, verifyPassword } from './auth';

// Für Einsteiger:innen: Mit Tests sichern wir ab, dass spätere Änderungen die Login-Logik nicht brechen.
describe('auth helpers', () => {
  it('rejects invalid password', async () => {
    const result = await verifyPassword('falsches-passwort', PASSWORD_HASH);
    expect(result).toBe(false);
  });

  it('accepts the correct password hash', async () => {
    const result = await verifyPassword('hinterland2025', PASSWORD_HASH);
    expect(result).toBe(true);
  });
});
