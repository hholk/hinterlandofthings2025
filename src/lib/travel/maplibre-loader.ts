// Für Einsteiger:innen: Dieser kleine Helper sorgt dafür, dass wir MapLibre
// unabhängig vom Build-Target immer gleich ansprechen können. Manche Bundler
// liefern das Modul als Default-Export aus, andere als klassisches Namespace-
// Objekt – wir gleichen das hier zentral an.
export type MapLibreNamespace = typeof import('maplibre-gl');

export type MapLibreModuleLike =
  | MapLibreNamespace
  | { default?: MapLibreNamespace }
  | null
  | undefined;

export function resolveMapLibreNamespace(candidate: MapLibreModuleLike): MapLibreNamespace {
  if (candidate && typeof candidate === 'object' && 'default' in candidate) {
    if (candidate.default) {
      return candidate.default;
    }
  }
  if (!candidate) {
    throw new Error('MapLibre GL konnte nicht geladen werden.');
  }
  return candidate as MapLibreNamespace;
}
