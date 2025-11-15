import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { authenticateUser, clearAuthentication, initializeAuth, isAuthenticated, readCookie } from './auth';

// Für Einsteiger:innen: Wir simulieren hier den Browser, um den Cookie-Fluss zu testen.
describe('auth store', () => {
  beforeEach(() => {
    document.cookie = 'auth-token=; Path=/; Max-Age=0';
    clearAuthentication();
  });

  it('reads existing auth cookies', () => {
    initializeAuth('auth-token=authenticated');
    expect(get(isAuthenticated)).toBe(true);
  });

  it('sets and clears cookies when toggling auth state', () => {
    authenticateUser();
    expect(get(isAuthenticated)).toBe(true);
    expect(readCookie(document.cookie) || readCookie('auth-token=authenticated')).toBe(true);

    clearAuthentication();
    expect(get(isAuthenticated)).toBe(false);
  });
});
