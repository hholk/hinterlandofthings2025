import { describe, expect, it } from 'vitest';
import {
  resolveMapVisibilityThreshold,
  createSegmentOpacityExpression,
  createStopOpacityExpression
} from './map-visibility';

describe('resolveMapVisibilityThreshold', () => {
  it('liefert den Sliderwert, wenn Schritte vorhanden sind', () => {
    expect(resolveMapVisibilityThreshold(5, 3)).toBe(3);
  });

  it('zeigt die komplette Route, wenn keine Schritte existieren', () => {
    expect(resolveMapVisibilityThreshold(0, 0)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('fängt ungültige Sliderwerte ab', () => {
    expect(resolveMapVisibilityThreshold(2, Number.NaN)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('hält zukünftige Segmente leicht sichtbar', () => {
    expect(createSegmentOpacityExpression(2)).toEqual(['case', ['<=', ['get', 'order'], 2], 1, 0.7]);
  });

  it('blendet Stopps nur minimal aus', () => {
    expect(createStopOpacityExpression(1)).toEqual(['case', ['<=', ['get', 'order'], 1], 1, 0.7]);
  });
});
