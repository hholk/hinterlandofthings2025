import { describe, expect, it } from 'vitest';
import { getPublicRoutes, isPublicRoute } from './public-routes';

describe('public route helper', () => {
  it('erkennt die Chile Experience als öffentliche Route', () => {
    expect(isPublicRoute('/experiences/travel-routes')).toBe(true);
    expect(isPublicRoute('/experiences/travel-routes/details/day-1')).toBe(true);
  });

  it('berücksichtigt das Base-Path-Prefix der App', () => {
    expect(isPublicRoute('/hub/experiences/travel-routes', '/hub')).toBe(true);
    expect(isPublicRoute('/hub/experiences/travel-routes/plan', '/hub')).toBe(true);
    expect(isPublicRoute('/other/experiences/travel-routes', '/hub')).toBe(false);
  });

  it('liefert eine Liste aller öffentlichen Pfade mit korrekt gesetztem Prefix', () => {
    expect(getPublicRoutes()).toEqual(['/experiences/travel-routes']);
    expect(getPublicRoutes('/hub')).toEqual(['/hub/experiences/travel-routes']);
  });
});
