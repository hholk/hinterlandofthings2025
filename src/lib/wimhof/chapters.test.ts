import { describe, expect, it } from 'vitest';
import { buildChapters, clampRounds, type Phase } from './chapters';

describe('clampRounds', () => {
  it('caps and floors incoming values', () => {
    expect(clampRounds(0)).toBe(1);
    expect(clampRounds(4)).toBe(4);
    expect(clampRounds(11)).toBe(10);
  });

  it('handles non-numeric values gracefully', () => {
    expect(clampRounds(Number.NaN)).toBe(1);
  });
});

describe('buildChapters', () => {
  const basePhase: Phase = 'BREATH';

  it('marks earlier rounds as done', () => {
    const result = buildChapters(4, 2, basePhase);
    expect(result[0].state).toBe('done');
    expect(result[1].state).toBe('done');
  });

  it('marks the current round as active when in progress', () => {
    const result = buildChapters(3, 1, 'HOLD');
    expect(result[1].state).toBe('active');
  });

  it('marks all rounds as done when finishing', () => {
    const result = buildChapters(2, 1, 'DONE');
    expect(result.every((chapter) => chapter.state === 'done')).toBe(true);
  });

  it('caps the index when the current round exceeds the total', () => {
    const result = buildChapters(3, 8, basePhase);
    expect(result.at(-1)?.state).toBe('active');
  });
});
