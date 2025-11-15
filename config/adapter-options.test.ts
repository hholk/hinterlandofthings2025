import { describe, expect, it } from 'vitest';
import { adapterOptions } from './adapter-options.js';

// Für Einsteiger:innen: Dieser Test stellt sicher, dass GitHub Pages beim Direktaufruf
// einer Unterseite nicht die Standard-404-Seite von GitHub anzeigt.
describe('adapter options', () => {
  it('nutzt 404.html als Fallback für GitHub Pages', () => {
    expect(adapterOptions.fallback).toBe('404.html');
  });
});
