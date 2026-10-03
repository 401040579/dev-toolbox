// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '@/tools/text/markdown-preview';
import { optimizeSvg } from '@/tools/image/svg-optimizer';
import { parseSvg } from './preview-safety';

describe('static previews', () => {
  it('renders Markdown structure, code and safe links without image requests', () => {
    const root = document.createElement('div');
    root.innerHTML = parseMarkdown('# Hello\n\n1. One\n2. Two\n\n```html\n<img src="x">\n```\n\n[Docs](https://example.com)\n\n![Remote](https://example.com/image)\n\n| A | B |\n| --- | --- |\n| 1 | 2 |');
    expect(root.querySelector('h1')?.textContent).toBe('Hello');
    expect(root.querySelectorAll('ol li')).toHaveLength(2);
    expect(root.querySelector('code')?.textContent).toContain('<img src="x">');
    expect(root.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(root.querySelector('table')).not.toBeNull();
    expect(root.querySelector('img')).toBeNull();
  });

  it.each([
    '[Click](x" onclick="window.__xss=7")',
    '[Click](javascript:alert%281%29)',
    '[Click](data:text/html,evil)',
    '<svg onload="alert(1)"><foreignObject><img src=x onerror=alert(1)></foreignObject></svg>',
    '[Click](https://example.com "title\\" onmouseover=alert(1)")',
  ])('neutralizes Markdown payload %s', (payload) => {
    const root = document.createElement('div');
    root.innerHTML = parseMarkdown(payload);
    expect(root.querySelector('svg, img, script, iframe')).toBeNull();
    for (const element of root.querySelectorAll('*')) {
      expect(Array.from(element.attributes).some((attr) => attr.name.startsWith('on'))).toBe(false);
    }
    for (const a of root.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      expect(['https:', 'http:', 'mailto:']).toContain(new URL(a.href).protocol);
    }
  });

  it('preserves safe SVG artwork, references and text spacing through export', () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g"><stop offset="0" stop-color="red"/></linearGradient><path id="p" d="M0 0h20v20z"/></defs><use href="#p" fill="url(#g)"/><text x="10" y="40">a  b</text></svg>';
    for (const prettify of [true, false]) {
      const root = parseSvg(optimizeSvg(input, { removeComments: true, removeMetadata: true, removeEmptyAttrs: true, removeXMLDecl: true, minify: !prettify, prettify })).documentElement;
      expect(root.querySelector('use')?.getAttribute('href')).toBe('#p');
      expect(root.querySelector('use')?.getAttribute('fill')).toBe('url(#g)');
      expect(root.querySelector('text')?.textContent).toBe('a  b');
    }
  });

  it('removes SVG active content and every external resource mechanism from export', () => {
    const root = parseSvg(optimizeSvg('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" onload="alert(1)"><script>alert(1)</script><style>@import "https://example.com"</style><foreignObject><img src="https://example.com"/></foreignObject><image href="https://example.com"/><use xlink:href="//example.com/x"/><rect style="fill:url(https://example.com)" fill="url(https://example.com)" filter="url(https://example.com)"/><animate attributeName="href" values="javascript:alert(1)"/><set attributeName="onload" to="alert(1)"/></svg>')).documentElement;
    expect(root.querySelector('script, style, foreignObject, image, animate, set')).toBeNull();
    expect(root.getAttribute('onload')).toBeNull();
    expect(root.querySelector('use')?.getAttribute('xlink:href')).toBeNull();
    expect(root.querySelector('rect')?.attributes.length).toBe(0);
  });

  it('rejects malformed roots and doctypes', () => {
    for (const input of ['<div/>', '<svg><g></svg>', '<!DOCTYPE svg [<!ENTITY a "bad">]><svg/>']) {
      expect(() => optimizeSvg(input)).toThrow();
    }
  });
});
