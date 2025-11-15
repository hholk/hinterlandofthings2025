import { describe, expect, it } from 'vitest';
import { resolveBasePath } from './base-path.js';

// Für Einsteiger:innen: Diese Tests zeigen, wie GitHub Pages den Basis-Pfad bestimmt.
describe('resolveBasePath', () => {
  it('returns empty base in dev mode', () => {
    expect(resolveBasePath({ dev: true, basePath: '/custom' })).toBe('');
  });

  it('prefers the BASE_PATH variable', () => {
    expect(resolveBasePath({ basePath: 'custom-path' })).toBe('/custom-path');
  });

  it('normalizes whitespace and missing leading slash', () => {
    expect(resolveBasePath({ basePath: '  nested/path/  ' })).toBe('/nested/path');
  });

  it('derives the repo name from GITHUB_REPOSITORY', () => {
    expect(resolveBasePath({ githubRepository: 'owner/hub' })).toBe('/hub');
  });

  it('falls back to empty string when nothing fits', () => {
    expect(resolveBasePath({})).toBe('');
  });
});
