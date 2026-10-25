// Shared route inventory for sitemap generation and static route shells.
// Reads the tool registry, locale copy and CNAME from source so the public
// route list can never drift from what the app actually registers.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(projectRoot, path), 'utf8');

function requireMatch(source, pattern, label) {
  const match = pattern.exec(source);
  if (!match) throw new Error(`site-routes: could not find ${label}`);
  return match;
}

export function readSiteUrl() {
  const fromEnv = process.env.SITE_URL?.trim();
  const host = fromEnv || `https://${read('public/CNAME').trim()}`;
  const url = new URL(host);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(`site-routes: unsupported SITE_URL ${host}`);
  return url.origin;
}

export function readBasePath() {
  const base = process.env.BASE_PATH || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

// Tool ids and categories come from the files that registry.ts imports and lists in ALL_TOOLS.
export function readRegisteredTools() {
  const registry = read('src/tools/registry.ts');
  const importPaths = new Map();
  for (const match of registry.matchAll(/^import (\w+) from '\.\/([\w/-]+)';$/gm)) importPaths.set(match[1], match[2]);
  const list = requireMatch(registry, /const ALL_TOOLS: ToolDefinition\[\] = \[([\s\S]*?)\];/, 'ALL_TOOLS')[1];
  const names = list.split(',').map((name) => name.trim()).filter(Boolean);
  const seen = new Set();
  return names.map((name) => {
    const relative = importPaths.get(name);
    if (!relative) throw new Error(`site-routes: ${name} is listed in ALL_TOOLS without an import`);
    const file = [`src/tools/${relative}/index.ts`, `src/tools/${relative}.ts`].find((candidate) => existsSync(resolve(projectRoot, candidate)));
    if (!file) throw new Error(`site-routes: cannot locate source for ${name} (${relative})`);
    const source = read(file);
    const declaration = source.indexOf(': ToolDefinition = {');
    if (declaration < 0) throw new Error(`site-routes: ${file} has no ToolDefinition literal`);
    const body = source.slice(declaration);
    const id = requireMatch(body, /\bid: '([\w-]+)'/, `id in ${file}`)[1];
    const category = requireMatch(body, /\bcategory: '([\w-]+)'/, `category in ${file}`)[1];
    if (seen.has(id)) throw new Error(`site-routes: duplicate tool id ${id}`);
    seen.add(id);
    return { id, category, file };
  });
}

export function readCategories() {
  const union = requireMatch(read('src/tools/types.ts'), /export type ToolCategory = ([^;]+);/, 'ToolCategory')[1];
  return [...union.matchAll(/'([\w-]+)'/g)].map((match) => match[1]);
}

function readToolI18nKeys() {
  const block = requireMatch(read('src/i18n/tool-copy.ts'), /TOOL_I18N_KEYS: Record<string, string> = \{([\s\S]*?)\};/, 'TOOL_I18N_KEYS')[1];
  return new Map([...block.matchAll(/"([\w-]+)": "(\w+)"/g)].map((match) => [match[1], match[2]]));
}

const SITE_NAME = 'Dev Toolbox';

function requireCopy(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`site-routes: missing English copy for ${label}`);
  return value.trim();
}

// Every public route with the English title/description crawlers and share cards should see.
export function collectSiteRoutes() {
  const en = JSON.parse(read('src/i18n/en/common.json'));
  const categories = readCategories();
  const tools = readRegisteredTools();
  const i18nKeys = readToolI18nKeys();
  const tagline = requireCopy(en.app?.tagline, 'app.tagline').replace(/\.$/, '');
  const toolsWord = requireCopy(en.app?.toolsWord, 'app.toolsWord');
  const toolSuffix = requireCopy(en.app?.toolMetaSuffix, 'app.toolMetaSuffix');
  const routes = [
    { path: '/', kind: 'home', title: `${SITE_NAME} — ${tagline}`, description: `${requireCopy(en.app?.tagline, 'app.tagline')} ${tools.length} tools and a local Pipeline builder with no backend, no account and no uploads.` },
    { path: '/pipeline', kind: 'pipeline', title: `${requireCopy(en.pipeline?.title, 'pipeline.title')} — ${SITE_NAME}`, description: `${requireCopy(en.pipeline?.description, 'pipeline.description')}. Chain Base64, JSON, hash and text transforms locally and share synthetic examples by link.` },
    { path: '/about', kind: 'about', title: `${requireCopy(en.about?.title, 'about.title')} — ${SITE_NAME}`, description: requireCopy(en.about?.description, 'about.description') },
  ];
  for (const category of categories) {
    const label = requireCopy(en.categories?.[category], `categories.${category}`);
    const count = tools.filter((tool) => tool.category === category).length;
    routes.push({ path: `/tools/${category}`, kind: 'category', title: `${label} ${toolsWord} — ${SITE_NAME}`, description: `${requireCopy(en.categoryDesc?.[category], `categoryDesc.${category}`)}. ${count} browser tools, no upload.` });
  }
  for (const tool of tools) {
    if (!categories.includes(tool.category)) throw new Error(`site-routes: ${tool.id} uses unknown category ${tool.category}`);
    const key = i18nKeys.get(tool.id);
    if (!key) throw new Error(`site-routes: ${tool.id} has no TOOL_I18N_KEYS entry`);
    const copy = en.tools?.[key];
    const title = requireCopy(copy?.title, `tools.${key}.title`);
    const description = requireCopy(copy?.description, `tools.${key}.description`).replace(/\.$/, '');
    routes.push({ path: `/tools/${tool.category}/${tool.id}`, kind: 'tool', id: tool.id, title: `${title} — ${SITE_NAME}`, description: `${description}. ${toolSuffix}` });
  }
  return { siteName: SITE_NAME, siteUrl: readSiteUrl(), basePath: readBasePath(), categories, tools, routes };
}

export function routeUrl(site, route) {
  return new URL(site.basePath + route.path.replace(/^\//, ''), site.siteUrl).href;
}

export function renderSitemap(site) {
  const entries = site.routes.map((route) => `  <url><loc>${escapeXml(routeUrl(site, route))}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}

export function escapeXml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
