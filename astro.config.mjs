// @ts-check
import { defineConfig } from 'astro/config';

// Custom-domain GitHub Pages deploy. The CNAME at public/CNAME (=
// sparkapp.dev) is what makes Pages serve under that hostname; `site`
// here just helps Astro emit absolute URLs (sitemap, og:url, canonicals)
// pointed at the real domain rather than the github.io fallback.
export default defineConfig({
  site: 'https://sparkapp.dev',
  output: 'static',
  build: {
    // Default behaviour — emit per-page index.html so /privacy works as
    // a folder with a directory-index, no trailing-slash awkwardness.
    format: 'directory',
  },
});
