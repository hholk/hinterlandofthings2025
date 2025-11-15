import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const projectRootDir = new URL('.', import.meta.url);

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
  resolve: {
    alias: [
      { find: '$data', replacement: fileURLToPath(new URL('src/lib/data', projectRootDir)) },
      { find: '$components', replacement: fileURLToPath(new URL('src/lib/components', projectRootDir)) },
      { find: '$utils', replacement: fileURLToPath(new URL('src/lib/utils', projectRootDir)) },
      { find: '$stores', replacement: fileURLToPath(new URL('src/lib/stores', projectRootDir)) }
    ]
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
