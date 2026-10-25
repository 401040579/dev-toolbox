// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createInstance } from 'i18next';
import en from '@/i18n/en/common.json';
import zh from '@/i18n/zh/common.json';
import { applyPageMeta, describeRoute, normalizeRoutePath } from './page-meta';

async function translator(language: 'en' | 'zh') {
  const instance = createInstance({ resources: { en: { translation: en }, zh: { translation: zh } }, lng: language, fallbackLng: 'en', interpolation: { escapeValue: false } });
  await instance.init();
  return instance.t;
}

describe('describeRoute', () => {
  it('builds the same English titles as the static route shells', async () => {
    const t = await translator('en');
    expect(describeRoute('/', t)).toEqual({ path: '/', title: 'Dev Toolbox — Practical tools for messaging, API payloads and POS troubleshooting', description: 'Practical tools for messaging, API payloads and POS troubleshooting.' });
    expect(describeRoute('/tools/text/sms-segment', t)).toEqual({
      path: '/tools/text/sms-segment',
      title: 'SMS Segment Calculator — Dev Toolbox',
      description: 'Calculate SMS encoding, segment count, and character usage. Free tool from Dev Toolbox: runs in your browser, nothing is uploaded.',
    });
    expect(describeRoute('/tools/text', t).title).toBe('Text tools — Dev Toolbox');
    expect(describeRoute('/pipeline', t).title).toBe('Pipeline Builder — Dev Toolbox');
    expect(describeRoute('/about', t).title).toBe('About — Dev Toolbox');
  });

  it('follows the active language', async () => {
    const t = await translator('zh');
    const meta = describeRoute('/tools/text/sms-segment', t);
    expect(meta.title).toBe(`${zh.tools.smsSegment.title} — Dev Toolbox`);
    expect(meta.description).toContain('不上传任何内容');
  });

  it('falls back to the site name for unknown or mismatched routes', async () => {
    const t = await translator('en');
    expect(describeRoute('/tools/image/sms-segment', t).title).toBe('Dev Toolbox');
    expect(describeRoute('/tools/nope', t).title).toBe('Dev Toolbox');
    expect(describeRoute('/whatever/else', t).title).toBe('Dev Toolbox');
  });

  it('normalizes trailing slashes and never includes query or hash', () => {
    expect(normalizeRoutePath('/tools/text/sms-segment/')).toBe('/tools/text/sms-segment');
    expect(normalizeRoutePath('/')).toBe('/');
    expect(normalizeRoutePath('')).toBe('/');
    expect(normalizeRoutePath('pipeline')).toBe('/pipeline');
  });
});

describe('applyPageMeta', () => {
  it('updates title, description and canonical in the document head', () => {
    document.head.innerHTML = '<meta name="description" content="old" /><link rel="canonical" href="https://example.invalid/" />';
    applyPageMeta({ path: '/tools/text/sms-segment', title: 'SMS Segment Calculator — Dev Toolbox', description: 'Desc.' }, document, 'https://app.aiuos.com', '/');
    expect(document.title).toBe('SMS Segment Calculator — Dev Toolbox');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Desc.');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://app.aiuos.com/tools/text/sms-segment');
    applyPageMeta({ path: '/', title: 'Home', description: 'Home desc' }, document, 'https://app.aiuos.com', '/');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://app.aiuos.com/');
  });

  it('respects a nested base path', () => {
    document.head.innerHTML = '<link rel="canonical" href="https://example.invalid/" />';
    applyPageMeta({ path: '/pipeline', title: 'Pipeline', description: '' }, document, 'https://user.github.io', '/dev-toolbox/');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://user.github.io/dev-toolbox/pipeline');
  });
});
