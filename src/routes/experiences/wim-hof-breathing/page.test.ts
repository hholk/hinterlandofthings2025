import { describe, expect, test } from 'vitest';
import { load } from './+page';

// Für Einsteiger:innen: Der Test stellt sicher, dass die Unterseite als Modul
// mit den zentral gepflegten Metadaten ausgeliefert wird.
describe('Wim-Hof-Breathing page load', () => {
  test('liefert die Experience-Metadaten aus dem zentralen Katalog', async () => {
    const result = await load({} as never);

    expect(result.experience).toBeDefined();
    expect(result.experience.id).toBe('wim-hof-breathing');
    expect(result.experience.title).toBe('Wim-Hof-Breathing');
    expect(result.experience.description).toContain('Atem-Session');
  });
});
