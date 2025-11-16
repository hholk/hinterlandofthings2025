import { describe, expect, it } from 'vitest';
import { getDefaultSliderIndex, type TimelineStepLike } from './timeline-helpers';

describe('getDefaultSliderIndex', () => {
  it('returns 0 when no steps exist', () => {
    expect(getDefaultSliderIndex([])).toBe(0);
    expect(getDefaultSliderIndex(null)).toBe(0);
    expect(getDefaultSliderIndex(undefined)).toBe(0);
  });

  it('returns the last index for multiple steps', () => {
    const steps: TimelineStepLike[] = [
      { order: 0, label: 'Tag 1' },
      { order: 1, label: 'Tag 2' },
      { order: 2, label: 'Tag 3' }
    ];
    expect(getDefaultSliderIndex(steps)).toBe(2);
  });

  it('handles single-step timelines gracefully', () => {
    const steps: TimelineStepLike[] = [{ order: 0, label: 'Nur Start' }];
    expect(getDefaultSliderIndex(steps)).toBe(0);
  });
});
