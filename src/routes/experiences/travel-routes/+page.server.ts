import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { experiencePages } from '../../../lib/data/experiences';
import { chileTravelData } from '../../../lib/data/chile-travel/server';

const EXPERIENCE_ID = 'travel-routes';

// Für Einsteiger:innen: Die Unterseite ist statisch unter /experiences/travel-routes erreichbar.
// Deshalb greifen wir hier nicht auf URL-Parameter zu, sondern suchen direkt nach der ID.
export const load: PageServerLoad = async () => {
  const experience = experiencePages.find((item) => item.id === EXPERIENCE_ID);

  if (!experience) {
    throw error(500, 'Erlebnis nicht konfiguriert');
  }

  return {
    experience,
    travel: chileTravelData
  };
};
