import { describe, expect, it } from 'vitest';
import { resolveMapLibreNamespace, type MapLibreNamespace } from './maplibre-loader';

describe('resolveMapLibreNamespace', () => {
  const fakeModule = {
    Map: class {},
    NavigationControl: class {}
  } as unknown as MapLibreNamespace;

  it('verwendet den Default-Export, wenn vorhanden', () => {
    const wrapped = { default: fakeModule };
    expect(resolveMapLibreNamespace(wrapped)).toBe(fakeModule);
  });

  it('reicht das Modul unverändert weiter, wenn kein Default existiert', () => {
    expect(resolveMapLibreNamespace(fakeModule)).toBe(fakeModule);
  });

  it('wirft eine verständliche Fehlermeldung bei ungültigen Werten', () => {
    expect(() => resolveMapLibreNamespace(null)).toThrow(/MapLibre GL/);
  });
});
