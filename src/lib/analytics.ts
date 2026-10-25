// Optional, cookie-free page-view counting. The build ships with it OFF; a
// deployment opts in with VITE_ANALYTICS_PROVIDER=goatcounter plus a site code.
//
// This file is the complete list of what leaves the browser when it is on:
// one GET per route change carrying the route path (never query or hash) and
// the referring site's origin. No third-party script is loaded, no cookie or
// storage identifier is set, and tool inputs, drafts, files and Pipelines are
// never part of the request. See README.md → "Analytics".
import { getTool } from '@/tools/registry';
import { CATEGORY_META } from '@/lib/constants';

export interface AnalyticsEnv {
  VITE_ANALYTICS_PROVIDER?: string;
  VITE_ANALYTICS_GOATCOUNTER_SITE?: string;
  VITE_ANALYTICS_ENDPOINT?: string;
}

export interface AnalyticsConfig {
  provider: 'goatcounter';
  endpoint: string;
}

const SITE_CODE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

/** Null unless the build explicitly enabled a supported provider with a usable target. */
export function resolveAnalyticsConfig(env: AnalyticsEnv = import.meta.env): AnalyticsConfig | null {
  if (env.VITE_ANALYTICS_PROVIDER?.trim().toLowerCase() !== 'goatcounter') return null;
  const custom = env.VITE_ANALYTICS_ENDPOINT?.trim();
  if (custom) {
    try {
      const url = new URL(custom);
      if (url.protocol === 'https:' && !url.search && !url.hash && !url.username) return { provider: 'goatcounter', endpoint: url.href };
    } catch { /* Invalid endpoint keeps analytics off. */ }
    return null;
  }
  const site = env.VITE_ANALYTICS_GOATCOUNTER_SITE?.trim();
  if (!site || !SITE_CODE.test(site)) return null;
  return { provider: 'goatcounter', endpoint: `https://${site.toLowerCase()}.goatcounter.com/count` };
}

/**
 * Reduces a router pathname to one of the app's known route shapes. Anything else
 * becomes `/404`, so a mistyped or crafted URL is never reported verbatim.
 */
export function pageviewPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return '/';
  if (segments.length === 1 && (segments[0] === 'pipeline' || segments[0] === 'about')) return `/${segments[0]}`;
  if (segments[0] === 'tools' && segments.length === 2 && segments[1]! in CATEGORY_META) return `/tools/${segments[1]}`;
  if (segments[0] === 'tools' && segments.length === 3) {
    const tool = getTool(segments[2]!);
    if (tool && tool.category === segments[1]) return `/tools/${tool.category}/${tool.id}`;
  }
  return '/404';
}

/** Origin of the referring site only (no path, query or hash); empty for direct or same-site navigation. */
export function referrerSite(referrer: string, ownOrigin: string): string {
  if (!referrer) return '';
  try {
    const url = new URL(referrer);
    if (url.origin === ownOrigin || (url.protocol !== 'https:' && url.protocol !== 'http:')) return '';
    return url.origin;
  } catch {
    return '';
  }
}

export interface CountingContext {
  hostname: string;
  webdriver?: boolean;
  doNotTrack?: string | null;
  globalPrivacyControl?: boolean;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']);

/** Honors Do Not Track and Global Privacy Control; skips automation and local development. */
export function shouldCount({ hostname, webdriver, doNotTrack, globalPrivacyControl }: CountingContext): boolean {
  if (webdriver || globalPrivacyControl || doNotTrack === '1' || doNotTrack === 'yes') return false;
  const host = hostname.toLowerCase();
  return !LOCAL_HOSTS.has(host) && !host.endsWith('.localhost');
}

export function pageviewUrl(config: AnalyticsConfig, path: string, referrer: string): string {
  const url = new URL(config.endpoint);
  url.searchParams.set('p', path);
  if (referrer) url.searchParams.set('r', referrer);
  return url.href;
}

export interface TrackerDeps {
  config: AnalyticsConfig | null;
  context: CountingContext;
  referrer: string;
  origin: string;
  send: (url: string) => void;
}

/** Returns a function that reports a route once per change; consecutive repeats are ignored. */
export function createPageviewTracker(deps: TrackerDeps): (pathname: string) => void {
  let last: string | null = null;
  return (pathname) => {
    if (!deps.config || !shouldCount(deps.context)) return;
    const path = pageviewPath(pathname);
    if (path === last) return;
    last = path;
    deps.send(pageviewUrl(deps.config, path, referrerSite(deps.referrer, deps.origin)));
  };
}

function browserDeps(): TrackerDeps {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return {
    config: resolveAnalyticsConfig(),
    context: { hostname: location.hostname, webdriver: nav.webdriver, doNotTrack: nav.doNotTrack, globalPrivacyControl: nav.globalPrivacyControl },
    referrer: document.referrer,
    origin: location.origin,
    // no-referrer keeps the page URL out of the request headers; the response is never read.
    send: (url) => { fetch(url, { method: 'GET', mode: 'no-cors', credentials: 'omit', cache: 'no-store', keepalive: true, referrerPolicy: 'no-referrer' }).catch(() => { /* Counting must never affect the app. */ }); },
  };
}

let tracker: ((pathname: string) => void) | null = null;

/** Entry point used by the router layout; a no-op in builds without analytics. */
export function recordPageview(pathname: string): void {
  tracker ??= createPageviewTracker(browserDeps());
  tracker(pathname);
}

/** Whether this build has analytics compiled in. */
export function analyticsEnabled(env: AnalyticsEnv = import.meta.env): boolean {
  return resolveAnalyticsConfig(env) !== null;
}
