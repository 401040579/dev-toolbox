import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getToolList } from '@/tools/registry';
import { CATEGORY_META } from '@/lib/constants';
// @ts-expect-error build script without type declarations
import { collectSiteRoutes, projectRoot, renderSitemap } from './site-routes.mjs';

type SiteRoute = { path: string; kind: string; id?: string; title: string; description: string };
type Site = { siteUrl: string; basePath: string; categories: string[]; tools: { id: string; category: string }[]; routes: SiteRoute[] };

const site = collectSiteRoutes() as Site;

describe('site route inventory', () => {
  it('lists exactly the tools the registry registers, with their categories', () => {
    const registered = getToolList().map((tool) => ({ id: tool.id, category: tool.category }));
    expect(site.tools.map((tool) => ({ id: tool.id, category: tool.category }))).toEqual(registered);
    expect(site.categories).toEqual(Object.keys(CATEGORY_META));
  });

  it('exposes one route per tool and category plus home, pipeline and about', () => {
    const toolRoutes = site.routes.filter((route) => route.kind === 'tool');
    expect(toolRoutes.map((route) => route.path)).toEqual(getToolList().map((tool) => `/tools/${tool.category}/${tool.id}`));
    expect(site.routes.filter((route) => route.kind === 'category').map((route) => route.path)).toEqual(Object.keys(CATEGORY_META).map((category) => `/tools/${category}`));
    expect(site.routes.slice(0, 3).map((route) => route.path)).toEqual(['/', '/pipeline', '/about']);
    expect(new Set(site.routes.map((route) => route.path)).size).toBe(site.routes.length);
  });

  it('gives every route a distinct English title and a description', () => {
    const titles = new Set<string>();
    for (const route of site.routes) {
      expect(route.title, route.path).toMatch(/\S/);
      expect(route.title, route.path).toContain('Dev Toolbox');
      expect(route.description, route.path).toMatch(/\S/);
      expect(route.description.length, route.path).toBeLessThanOrEqual(220);
      titles.add(route.title);
    }
    expect(titles.size).toBe(site.routes.length);
    expect(site.routes.find((route) => route.id === 'sms-segment')?.title).toBe('SMS Segment Calculator — Dev Toolbox');
  });

  it('keeps public/sitemap.xml in sync with the registry (run npm run sitemap after adding a tool)', () => {
    expect(site.siteUrl).toBe('https://app.aiuos.com');
    expect(readFileSync(resolve(projectRoot, 'public/sitemap.xml'), 'utf8')).toBe(renderSitemap(site));
  });

  it('points robots.txt at the sitemap', () => {
    expect(readFileSync(resolve(projectRoot, 'public/robots.txt'), 'utf8')).toContain('Sitemap: https://app.aiuos.com/sitemap.xml');
  });
});
