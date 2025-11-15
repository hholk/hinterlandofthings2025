// Für Einsteiger:innen: Statt jedes Erlebnis hart im Markup zu codieren,
// pflegen wir alle Informationen in diesem Array. So bleiben UI und Daten entkoppelt.
export interface ExperiencePage {
  id: string;
  href: string;
  title: string;
  description: string;
  icon: string;
}

export const experiencePages: ExperiencePage[] = [
  {
    id: 'hinterland',
    href: '/experiences/hinterland',
    title: 'Hinterland of Things 2025',
    description: 'Agenda, Favoriten und Markdown-Briefings in einem klaren Zwei-Spalten-Layout.',
    icon:
      '<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><circle cx="32" cy="20" r="12" stroke="currentColor" stroke-width="4" fill="none" /><rect x="24" y="32" width="16" height="20" rx="8" /><line x1="32" y1="52" x2="32" y2="60" stroke="currentColor" stroke-width="4" /></svg>'
  },
  {
    id: 'universal-home',
    href: '/experiences/universal-home',
    title: 'Universal Home',
    description: 'Filterbare Sessions mit passenden Farben für Präsentationen, Q&A und Networking.',
    icon:
      '<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M8 32 L32 12 L56 32 V56 H40 V40 H24 V56 H8 Z" stroke="currentColor" stroke-width="4" fill="none" /></svg>'
  },
  {
    id: 'universal-timeslots',
    href: '/experiences/universal-timeslots',
    title: 'Universal Home Zeitplan',
    description: 'Scrollbarer Kalender mit Overlay-Karten in derselben Glas-Optik.',
    icon:
      '<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><rect x="8" y="8" width="48" height="48" rx="6" ry="6" stroke="currentColor" stroke-width="4" fill="none" /><line x1="16" y1="24" x2="48" y2="24" stroke="currentColor" stroke-width="4" /><line x1="16" y1="34" x2="48" y2="34" stroke="currentColor" stroke-width="4" /></svg>'
  },
  {
    id: 'miele-analysis',
    href: '/experiences/miele-analysis',
    title: 'Miele Analyse',
    description: 'Lesefreundliche Artikelansicht mit interaktiver Tabelle für Szenarien.',
    icon:
      '<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="none" /><path d="M16 32h32" stroke="currentColor" stroke-width="4" /></svg>'
  },
  {
    id: 'portfolio',
    href: '/experiences/portfolio',
    title: 'Portfolio',
    description: 'Direkter Zugang zum Portfolio – bleibt bewusst im selben Look eingebettet.',
    icon:
      '<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><rect x="12" y="20" width="40" height="32" rx="4" ry="4" stroke="currentColor" stroke-width="4" fill="none" /><path d="M24 20v-4a8 8 0 0 1 16 0v4" stroke="currentColor" stroke-width="4" fill="none" /><line x1="12" y1="32" x2="52" y2="32" stroke="currentColor" stroke-width="4" /></svg>'
  },
  {
    id: 'travel-routes',
    href: '/experiences/travel-routes',
    title: 'Chile Travel Experience',
    description: 'Modulare Kartenoberfläche mit editierbaren Routen, Kosten und Medien.',
    icon:
      '<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M8 12h48v40H8z" stroke="currentColor" stroke-width="4" fill="none" /><polyline points="12,44 24,32 34,40 44,24 52,32" stroke="currentColor" stroke-width="4" fill="none" /><circle cx="24" cy="32" r="3" fill="currentColor" /><circle cx="34" cy="40" r="3" fill="currentColor" /><circle cx="44" cy="24" r="3" fill="currentColor" /></svg>'
  },
  {
    id: 'voucher-henri',
    href: '/experiences/voucher-henri',
    title: 'Abenteuer Piesberg Gutschein',
    description: 'Apple-inspirierte Gutscheinseite für ein gemeinsames Fossilien-Erlebnis.',
    icon:
      '<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><rect x="8" y="12" width="48" height="40" rx="12" ry="12" stroke="currentColor" stroke-width="4" fill="none" /><path d="M16 28h32" stroke="currentColor" stroke-width="4" stroke-linecap="round" /><circle cx="24" cy="40" r="4" /><circle cx="40" cy="40" r="4" /></svg>'
  },
  {
    id: 'voucher-henri-planetarium',
    href: '/experiences/voucher-henri-planetarium',
    title: 'Planetariums-Gutschein',
    description: 'Gutscheinseite für einen gemeinsamen Besuch im Planetarium Osnabrück.',
    icon:
      '<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><circle cx="32" cy="32" r="20" stroke="currentColor" stroke-width="4" fill="none" /><path d="M8 28c8 8 24 16 48 0" stroke="currentColor" stroke-width="4" stroke-linecap="round" /><circle cx="46" cy="24" r="4" /></svg>'
  }
];
