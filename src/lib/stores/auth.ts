import { browser } from '$app/environment';
import { readable, writable } from 'svelte/store';
import { AUTH_COOKIE_NAME } from '$utils/auth';

const AUTH_COOKIE_VALUE = 'authenticated';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

const authStore = writable(false);

// Für Einsteiger:innen: Stores liefern reaktive Werte in Svelte-Komponenten.
export const isAuthenticated = readable(false, (set) => {
  const unsubscribe = authStore.subscribe(set);
  return () => unsubscribe();
});

// Für Einsteiger:innen: Optionaler Parameter erlaubt Tests, Cookies direkt zu übergeben.
export function initializeAuth(source?: string) {
  if (source) {
    authStore.set(readCookie(source));
    return;
  }

  if (!browser) {
    authStore.set(false);
    return;
  }

  authStore.set(readCookie(document.cookie));
}

export function authenticateUser() {
  authStore.set(true);
  if (!browser) {
    return;
  }
  document.cookie = `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearAuthentication() {
  authStore.set(false);
  if (!browser) {
    return;
  }
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function readCookie(source: string): boolean {
  return source
    .split(';')
    .map((entry) => entry.trim())
    .some((entry) => {
      if (!entry) {
        return false;
      }

      const [name, value] = entry.split('=');
      return name === AUTH_COOKIE_NAME && value === AUTH_COOKIE_VALUE;
    });
}
