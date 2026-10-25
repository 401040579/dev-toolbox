// Emits a static HTML shell per public route after `vite build`.
// GitHub Pages serves dist/tools/text/sms-segment.html for /tools/text/sms-segment
// with HTTP 200 instead of the 404.html redirect, so crawlers and link previews
// receive a per-page title, description and canonical URL. The shell loads the same
// bundle as index.html; the service worker still answers navigations from its
// precached index.html, so offline behavior is unchanged.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { collectSiteRoutes, escapeXml, projectRoot, routeUrl } from './site-routes.mjs';

const site = collectSiteRoutes();
const distDir = resolve(projectRoot, 'dist');
const template = readFileSync(resolve(distDir, 'index.html'), 'utf8');

function replaceOnce(html, pattern, replacement, label) {
  const matches = html.match(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`));
  if (!matches || matches.length !== 1) throw new Error(`prerender: expected exactly one ${label} in dist/index.html, found ${matches?.length ?? 0}`);
  return html.replace(pattern, replacement);
}

export function renderShell(html, route) {
  const title = escapeXml(route.title);
  const description = escapeXml(route.description);
  const url = escapeXml(routeUrl(site, route));
  let out = html;
  out = replaceOnce(out, /<title>[^<]*<\/title>/, `<title>${title}</title>`, '<title>');
  out = replaceOnce(out, /<meta name="description" content="[^"]*"/, `<meta name="description" content="${description}"`, 'meta description');
  out = replaceOnce(out, /<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`, 'canonical link');
  out = replaceOnce(out, /<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`, 'og:title');
  out = replaceOnce(out, /<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`, 'og:description');
  out = replaceOnce(out, /<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`, 'og:url');
  out = replaceOnce(out, /<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${title}"`, 'twitter:title');
  out = replaceOnce(out, /<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${description}"`, 'twitter:description');
  out = replaceOnce(out, /<noscript>[\s\S]*?<\/noscript>/, `<noscript><main><h1>${escapeXml(route.title.replace(/ — Dev Toolbox$/, ''))}</h1><p>${description}</p><p>Dev Toolbox needs JavaScript: every tool runs inside your browser and nothing is uploaded.</p></main></noscript>`, '<noscript> block');
  return out;
}

let written = 0;
for (const route of site.routes) {
  if (route.path === '/') continue;
  const shell = renderShell(template, route);
  // Category routes share a name with the directory holding their tool shells
  // (tools/text.html next to tools/text/*.html), so also provide tools/text/index.html
  // in case the host resolves the directory before the .html file.
  const targets = [`.${route.path}.html`, ...(route.kind === 'category' ? [`.${route.path}/index.html`] : [])];
  for (const target of targets) {
    const file = resolve(distDir, target);
    if (!file.startsWith(distDir)) throw new Error(`prerender: refusing to write outside dist: ${file}`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, shell);
    written += 1;
  }
}
console.log(`Prerender: wrote ${written} route shells under dist/ (${site.tools.length} tools, ${site.categories.length} categories ×2, pipeline, about).`);
