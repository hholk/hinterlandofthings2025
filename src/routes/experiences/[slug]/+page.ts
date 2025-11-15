import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';
import { experiencePages } from '$data/experiences';

// Für Einsteiger:innen: entries sorgt dafür, dass jede Experience als HTML-Datei entsteht.
export const entries: EntryGenerator = () => {
  return experiencePages.map((item) => ({ slug: item.id }));
};

export const load: PageLoad = async ({ params }) => {
  const experience = experiencePages.find((item) => item.id === params.slug);

  if (!experience) {
    throw error(404, 'Seite nicht gefunden');
  }

  return { experience };
};
