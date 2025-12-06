import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { experiencePages } from '$data/experiences';

const EXPERIENCE_ID = 'wim-hof-breathing';

// Für Einsteiger:innen: Wir ziehen die Modul-Metadaten aus der zentralen Liste,
// damit Titel, Beschreibung und Icon auf der Unterseite immer synchron bleiben.
export const load: PageLoad = async () => {
  const experience = experiencePages.find((item) => item.id === EXPERIENCE_ID);

  if (!experience) {
    throw error(500, 'Erlebnis nicht konfiguriert');
  }

  return { experience };
};
