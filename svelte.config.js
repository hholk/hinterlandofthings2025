import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { resolveBasePath } from './config/base-path.js';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapterStatic({
      // Für Einsteiger:innen: GitHub Pages benötigt eine einzelne HTML-Datei als Fallback,
      // damit alle Unterseiten auch bei Direktaufrufen funktionieren.
      fallback: '200.html'
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
