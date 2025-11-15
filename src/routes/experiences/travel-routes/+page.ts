import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { experiencePages } from '$data/experiences';
import { chileTravelData } from '$data/chile-travel';

// Für Einsteiger:innen: Wir kombinieren hier Stammdaten der Experience
// mit den frisch definierten Reisevarianten.
export const load: PageLoad = async ({ params }) => {
  const experience = experiencePages.find((item) => item.id === params.slug);

  if (!experience) {
    throw error(404, 'Seite nicht gefunden');
  }

  return {
    experience,
    travel: chileTravelData
  };
};
