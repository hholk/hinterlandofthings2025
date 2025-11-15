// Für Einsteiger:innen: Manche Seiten (z. B. die Chile-Reiserouten) sollen ohne Passwort
// erreichbar sein. Diese Hilfsfunktionen kapseln die Logik, damit Layout und Tests
// dieselbe Definition nutzen können.
const PUBLIC_ROUTES = ['/experiences/travel-routes'] as const;

function normalizeBasePath(basePath: string | undefined) {
  if (!basePath || basePath === '/') {
    return '';
  }
  return basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
}

function matchesRoute(pathname: string, route: string) {
  if (!pathname) return false;
  if (pathname === route) {
    return true;
  }
  return pathname.startsWith(`${route}/`);
}

export function isPublicRoute(pathname: string, basePath?: string) {
  const normalizedBase = normalizeBasePath(basePath);
  return PUBLIC_ROUTES.some((route) => matchesRoute(pathname, `${normalizedBase}${route}`));
}

export function getPublicRoutes(basePath?: string) {
  const normalizedBase = normalizeBasePath(basePath);
  return PUBLIC_ROUTES.map((route) => `${normalizedBase}${route}`);
}
