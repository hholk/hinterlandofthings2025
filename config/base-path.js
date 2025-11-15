/**
 * Für Einsteiger:innen: Diese Funktion bestimmt den Basis-Pfad für Builds.
 * Auf GitHub Pages liegt die Seite häufig unter /REPOSITORY, weshalb wir
 * hier dynamisch einen passenden Wert zurückgeben.
 */
export function resolveBasePath({ dev = false, basePath, githubRepository } = {}) {
  if (dev) {
    return '';
  }

  if (typeof basePath === 'string' && basePath.trim().length > 0) {
    const trimmed = basePath.trim();
    const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return normalized.replace(/\/$/, '');
  }

  if (typeof githubRepository === 'string' && githubRepository.includes('/')) {
    const [, repo] = githubRepository.split('/');
    if (repo) {
      return `/${repo}`.replace(/\/$/, '');
    }
  }

  return '';
}
