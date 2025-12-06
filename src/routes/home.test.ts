import { render, screen } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import { describe, expect, it, vi } from 'vitest';

import HomePage from './+page.svelte';

vi.mock('$app/paths', () => ({ base: '' }));

// Für Einsteiger:innen: Wir mocken den Auth-Store, damit die Seite im Test sofort rendert.
vi.mock('$stores/auth', () => ({
  isAuthenticated: readable(false)
}));

describe('Homepage experiences grid', () => {
  it('zeigt die Wim-Hof-Kachel sichtbar an erster Stelle', () => {
    const { container } = render(HomePage);

    const experiencesHeading = screen.getByRole('heading', { level: 2, name: 'Module & Erlebnisse' });
    const experiencesSection = experiencesHeading.closest('section');
    expect(experiencesSection).not.toBeNull();

    // Die Karten nutzen die gemeinsame .card-Klasse; so vermeiden wir Kollisionen mit dem Fahrplan.
    const cards = experiencesSection?.querySelectorAll('.card');
    expect(cards?.length).toBeGreaterThan(0);

    const cardList = Array.from(cards ?? []);
    expect(cardList.some((card) => card.textContent?.includes('Wim-Hof-Breathing'))).toBe(true);
    expect(cardList[0]?.textContent).toContain('Wim-Hof-Breathing');

    // Absicherung gegen versehentlich ausgeblendete Experiences.
    expect(cardList).toHaveLength(9);
    expect(container).toBeTruthy();
  });
});
