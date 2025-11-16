import { describe, expect, it } from 'vitest';
import {
  ACTIVE_SEGMENT_OPACITY,
  ACTIVE_STOP_OPACITY,
  INACTIVE_SEGMENT_OPACITY,
  INACTIVE_STOP_OPACITY,
  createSegmentOpacityExpression,
  createStopOpacityExpression,
  resolveMapVisibilityThreshold
} from './map-visibility';

describe('map-visibility helpers', () => {
  it('keeps slider threshold safe for invalid input', () => {
    expect(resolveMapVisibilityThreshold(0, 3)).toBe(Number.MAX_SAFE_INTEGER);
    expect(resolveMapVisibilityThreshold(4, Number.NaN)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('returns slider value when steps exist', () => {
    expect(resolveMapVisibilityThreshold(5, 2)).toBe(2);
  });

  it('generates segment opacity expression with updated values', () => {
    expect(createSegmentOpacityExpression(2)).toEqual([
      'case',
      ['<=', ['get', 'order'], 2],
      ACTIVE_SEGMENT_OPACITY,
      INACTIVE_SEGMENT_OPACITY
    ]);
  });

  it('generates stop opacity expression with updated values', () => {
    expect(createStopOpacityExpression(1)).toEqual([
      'case',
      ['<=', ['get', 'order'], 1],
      ACTIVE_STOP_OPACITY,
      INACTIVE_STOP_OPACITY
    ]);
  });
});
