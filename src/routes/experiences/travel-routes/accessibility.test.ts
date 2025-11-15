import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(resolve(currentDir, '+page.svelte'), 'utf-8');

// Für Einsteiger:innen: Diese Tests prüfen statisch, ob die mobilen Leitplanken eingehalten werden.
describe('travel routes mobile markup', () => {
  it('behält aria-pressed auf den Routenschaltern bei', () => {
    expect(pageSource).toMatch(/aria-pressed=\{route\.id === selectedRouteId\}/);
  });

  it('stellt die Mindesthöhe für Touch-Flächen sicher', () => {
    expect(pageSource).toMatch(/min-height: 3\.25rem/);
  });
});
