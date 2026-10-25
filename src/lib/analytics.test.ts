import { describe, expect, it, vi } from 'vitest';
import { analyticsEnabled, createPageviewTracker, pageviewPath, pageviewUrl, referrerSite, resolveAnalyticsConfig, shouldCount } from './analytics';

const goat = { provider: 'goatcounter' as const, endpoint: 'https://demo-code.goatcounter.com/count' };

describe('resolveAnalyticsConfig', () => {
  it('is off unless the provider and a valid site code are both set', () => {
    expect(resolveAnalyticsConfig({})).toBeNull();
    expect(resolveAnalyticsConfig({ VITE_ANALYTICS_PROVIDER: 'goatcounter' })).toBeNull();
    expect(resolveAnalyticsConfig({ VITE_ANALYTICS_GOATCOUNTER_SITE: 'demo-code' })).toBeNull();
    expect(resolveAnalyticsConfig({ VITE_ANALYTICS_PROVIDER: 'ga4', VITE_ANALYTICS_GOATCOUNTER_SITE: 'demo-code' })).toBeNull();
    expect(resolveAnalyticsConfig({ VITE_ANALYTICS_PROVIDER: 'goatcounter', VITE_ANALYTICS_GOATCOUNTER_SITE: 'Demo-Code' })).toEqual(goat);
    expect(analyticsEnabled({})).toBe(false);
    expect(analyticsEnabled({ VITE_ANALYTICS_PROVIDER: 'goatcounter', VITE_ANALYTICS_GOATCOUNTER_SITE: 'demo-code' })).toBe(true);
  });

  it('rejects site codes that could change the request host', () => {
    for (const site of ['evil.example/', 'a.b', 'x y', '-dash', 'code?x=1', 'code/count', '']) {
      expect(resolveAnalyticsConfig({ VITE_ANALYTICS_PROVIDER: 'goatcounter', VITE_ANALYTICS_GOATCOUNTER_SITE: site }), site).toBeNull();
    }
  });

  it('accepts only a plain https self-hosted endpoint', () => {
    expect(resolveAnalyticsConfig({ VITE_ANALYTICS_PROVIDER: 'goatcounter', VITE_ANALYTICS_ENDPOINT: 'https://stats.example.com/count' })).toEqual({ provider: 'goatcounter', endpoint: 'https://stats.example.com/count' });
    for (const endpoint of ['http://stats.example.com/count', 'https://stats.example.com/count?x=1', 'https://user@stats.example.com/count', 'not a url']) {
      expect(resolveAnalyticsConfig({ VITE_ANALYTICS_PROVIDER: 'goatcounter', VITE_ANALYTICS_ENDPOINT: endpoint, VITE_ANALYTICS_GOATCOUNTER_SITE: 'demo-code' }), endpoint).toBeNull();
    }
  });
});

describe('pageviewPath', () => {
  it('reports only known route shapes', () => {
    expect(pageviewPath('/')).toBe('/');
    expect(pageviewPath('/pipeline')).toBe('/pipeline');
    expect(pageviewPath('/about/')).toBe('/about');
    expect(pageviewPath('/tools/text')).toBe('/tools/text');
    expect(pageviewPath('/tools/text/sms-segment')).toBe('/tools/text/sms-segment');
    expect(pageviewPath('/tools/image/qr-file-transfer/')).toBe('/tools/image/qr-file-transfer');
  });

  it('collapses unknown, mismatched or crafted paths to /404', () => {
    expect(pageviewPath('/tools/image/sms-segment')).toBe('/404');
    expect(pageviewPath('/tools/nope')).toBe('/404');
    expect(pageviewPath('/tools/text/sms-segment/extra')).toBe('/404');
    expect(pageviewPath('/secret-customer-id-1042')).toBe('/404');
    expect(pageviewPath('/pipeline/anything')).toBe('/404');
  });
});

describe('referrerSite', () => {
  it('keeps only the referring origin', () => {
    expect(referrerSite('https://news.ycombinator.com/item?id=1&SENTINEL', 'https://app.aiuos.com')).toBe('https://news.ycombinator.com');
    expect(referrerSite('https://app.aiuos.com/tools/text/sms-segment', 'https://app.aiuos.com')).toBe('');
    expect(referrerSite('', 'https://app.aiuos.com')).toBe('');
    expect(referrerSite('android-app://com.example', 'https://app.aiuos.com')).toBe('');
    expect(referrerSite('garbage', 'https://app.aiuos.com')).toBe('');
  });
});

describe('shouldCount', () => {
  it('honors DNT, GPC, automation and local hosts', () => {
    expect(shouldCount({ hostname: 'app.aiuos.com' })).toBe(true);
    expect(shouldCount({ hostname: 'app.aiuos.com', doNotTrack: '1' })).toBe(false);
    expect(shouldCount({ hostname: 'app.aiuos.com', globalPrivacyControl: true })).toBe(false);
    expect(shouldCount({ hostname: 'app.aiuos.com', webdriver: true })).toBe(false);
    expect(shouldCount({ hostname: 'app.aiuos.com', doNotTrack: '0' })).toBe(true);
    for (const hostname of ['localhost', '127.0.0.1', '[::1]', 'dev.localhost']) expect(shouldCount({ hostname }), hostname).toBe(false);
  });
});

describe('createPageviewTracker', () => {
  const context = { hostname: 'app.aiuos.com' };

  it('sends nothing when analytics is not configured', () => {
    const send = vi.fn();
    const track = createPageviewTracker({ config: null, context, referrer: 'https://example.com/', origin: 'https://app.aiuos.com', send });
    track('/');
    track('/tools/text/sms-segment');
    expect(send).not.toHaveBeenCalled();
  });

  it('sends the route path and referrer origin only, once per route change', () => {
    const send = vi.fn();
    const track = createPageviewTracker({ config: goat, context, referrer: 'https://news.ycombinator.com/item?id=1', origin: 'https://app.aiuos.com', send });
    track('/tools/text/sms-segment');
    track('/tools/text/sms-segment');
    track('/tools/text/sms-segment/');
    track('/pipeline');
    expect(send.mock.calls.map(([url]) => url)).toEqual([
      'https://demo-code.goatcounter.com/count?p=%2Ftools%2Ftext%2Fsms-segment&r=https%3A%2F%2Fnews.ycombinator.com',
      'https://demo-code.goatcounter.com/count?p=%2Fpipeline&r=https%3A%2F%2Fnews.ycombinator.com',
    ]);
    for (const [url] of send.mock.calls) expect(new URL(url).searchParams.has('t')).toBe(false);
  });

  it('never carries query strings or fragments, where shared Pipeline configuration lives', () => {
    const url = pageviewUrl(goat, pageviewPath('/pipeline'), '');
    expect(url).toBe('https://demo-code.goatcounter.com/count?p=%2Fpipeline');
    expect(url).not.toContain('config');
  });

  it('respects the counting context', () => {
    const send = vi.fn();
    const track = createPageviewTracker({ config: goat, context: { hostname: 'app.aiuos.com', doNotTrack: '1' }, referrer: '', origin: 'https://app.aiuos.com', send });
    track('/');
    expect(send).not.toHaveBeenCalled();
  });
});
