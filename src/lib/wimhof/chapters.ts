// Kleine, getestete Hilfsfunktionen für die Wim-Hof-Ansicht.
// Für Einsteiger:innen: Reine Utility-Funktionen halten die Svelte-Komponente schlank
// und können separat mit Vitest geprüft werden.

export type Phase = 'IDLE' | 'BREATH' | 'HOLD' | 'RECOVER' | 'DONE';

export type ChapterState = 'upcoming' | 'active' | 'done';

export interface ChapterStatus {
  index: number;
  label: string;
  state: ChapterState;
}

export const clampRounds = (value: number, min = 1, max = 10): number => {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
};

// Für Einsteiger:innen: Die Übersicht soll klar zeigen, welche Runde gerade läuft.
export const buildChapters = (total: number, current: number, phase: Phase): ChapterStatus[] => {
  const safeTotal = clampRounds(total);
  const cappedIndex = Math.min(Math.max(current, 0), safeTotal - 1);
  const finished = phase === 'DONE';

  return Array.from({ length: safeTotal }, (_, idx) => {
    let state: ChapterState = 'upcoming';

    if (finished || idx < cappedIndex) {
      state = 'done';
    } else if (idx === cappedIndex && phase !== 'IDLE') {
      state = 'active';
    }

    return {
      index: idx,
      label: `Runde ${idx + 1}`,
      state
    };
  });
};
