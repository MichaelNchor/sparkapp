// @ts-check
import { defineConfig } from 'astro/config';

// Deployed on Vercel (auto-detected Astro static build → dist/). The custom
// domain sparkapp.dev is attached in the Vercel dashboard, not via a repo
// file. `site` here helps Astro emit absolute URLs (sitemap, og:url,
// canonicals) pointed at the real domain.
export default defineConfig({
  site: 'https://sparkapp.dev',
  output: 'static',
  build: {
    // Default behaviour — emit per-page index.html so /privacy works as
    // a folder with a directory-index, no trailing-slash awkwardness.
    format: 'directory',
  },
});
