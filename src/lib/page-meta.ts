import type { TFunction } from 'i18next';
import { getTool } from '@/tools/registry';
import { getToolCopy } from '@/i18n/tool-copy';
import { CATEGORY_META } from '@/lib/constants';
import type { ToolCategory } from '@/tools/types';

export const SITE_NAME = 'Dev Toolbox';

export interface PageMeta {
  /** Router path without query or hash, e.g. `/tools/text/sms-segment`. */
  path: string;
  title: string;
  description: string;
}

/** Drops trailing slashes; never carries query or hash, so shared Pipeline configs stay out of metadata. */
export function normalizeRoutePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed || '/' : `/${trimmed}`;
}

// Mirrors scripts/site-routes.mjs so the live title matches the static route shell for English.
export function describeRoute(pathname: string, t: TFunction): PageMeta {
  const path = normalizeRoutePath(pathname);
  const segments = path.split('/').filter(Boolean);
  const tagline = t('app.tagline');
  if (segments.length === 0) return { path, title: `${SITE_NAME} — ${tagline.replace(/\.$/, '')}`, description: tagline };
  if (segments.length === 1 && segments[0] === 'pipeline') return { path, title: `${t('pipeline.title')} — ${SITE_NAME}`, description: t('pipeline.description') };
  if (segments.length === 1 && segments[0] === 'about') return { path, title: `${t('about.title')} — ${SITE_NAME}`, description: t('about.description') };
  if (segments[0] === 'tools' && segments.length === 2 && segments[1]! in CATEGORY_META) {
    const category = segments[1] as ToolCategory;
    return { path, title: `${t(`categories.${category}`)} ${t('app.toolsWord')} — ${SITE_NAME}`, description: t(`categoryDesc.${category}`) };
  }
  if (segments[0] === 'tools' && segments.length === 3) {
    const tool = getTool(segments[2]!);
    if (tool && tool.category === segments[1]) {
      const copy = getToolCopy(tool, t);
      return { path, title: `${copy.name} — ${SITE_NAME}`, description: `${copy.description.replace(/\.$/, '')}. ${t('app.toolMetaSuffix')}` };
    }
  }
  return { path, title: SITE_NAME, description: tagline };
}

function setAttribute(doc: Document, selector: string, attribute: string, value: string) {
  const element = doc.head.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
}

/** Writes the title, description and canonical URL for the current route into the document head. */
export function applyPageMeta(meta: PageMeta, doc: Document = document, origin: string = window.location.origin, base: string = import.meta.env.BASE_URL): void {
  doc.title = meta.title;
  setAttribute(doc, 'meta[name="description"]', 'content', meta.description);
  const canonical = new URL(`${base.replace(/\/$/, '')}${meta.path === '/' ? '/' : meta.path}`, origin).href;
  setAttribute(doc, 'link[rel="canonical"]', 'href', canonical);
}
