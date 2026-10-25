// Writes public/sitemap.xml from the tool registry. Runs before every build;
// the committed file is checked against this output by scripts/site-routes.test.ts.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { collectSiteRoutes, projectRoot, renderSitemap } from './site-routes.mjs';

const site = collectSiteRoutes();
const target = resolve(projectRoot, 'public/sitemap.xml');
const next = renderSitemap(site);
let previous = '';
try { previous = readFileSync(target, 'utf8'); } catch { /* First generation. */ }
if (previous !== next) writeFileSync(target, next);
console.log(`Sitemap: ${site.routes.length} URLs (${site.tools.length} tools, ${site.categories.length} categories, home, pipeline, about) for ${site.siteUrl}${previous === next ? ', unchanged' : ', updated'}.`);
