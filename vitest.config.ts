import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

// Für Einsteiger:innen: Diese Konfiguration vermeidet teure Build-Plugins, wenn wir nur Tests ausführen.
export default defineConfig({
  resolve: {
    alias: {
      '$app/environment': path.resolve(projectRoot, 'src/test/mocks/app-environment.ts'),
      '$utils/auth': path.resolve(projectRoot, 'src/lib/utils/auth.ts')
    }
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}', 'config/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html']
    }
  }
});
