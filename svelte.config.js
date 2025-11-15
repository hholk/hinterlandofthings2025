import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { resolveBasePath } from './config/base-path.js';
import { adapterOptions } from './config/adapter-options.js';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapterStatic({
      // Für Einsteiger:innen: GitHub Pages liefert bei unbekannten Pfaden automatisch 404.html aus.
      // Mit diesem Fallback landen Besucher:innen trotzdem in der Svelte-App statt auf der GitHub-Fehlerseite.
      ...adapterOptions
    }),
    alias: {
      $data: 'src/lib/data',
      $components: 'src/lib/components',
      $utils: 'src/lib/utils',
      $stores: 'src/lib/stores'
    },
    paths: {
      base: resolveBasePath({
        dev,
        basePath: process.env.BASE_PATH,
        githubRepository: process.env.GITHUB_REPOSITORY
      })
    },
    prerender: {
      entries: ['*']
    }
  }
};

export default config;
