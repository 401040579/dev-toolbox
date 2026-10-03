import createDOMPurify from 'dompurify';

const SVG_NS = 'http://www.w3.org/2000/svg';
// Static artwork only: no scripts, HTML, images, CSS, links or animation.
const SVG_TAGS = [
  'svg', 'g', 'defs', 'title', 'desc', 'metadata', 'path', 'rect', 'circle',
  'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan', 'textPath', 'use',
  'symbol', 'clipPath', 'mask', 'pattern', 'linearGradient', 'radialGradient',
  'stop', 'filter', 'feBlend', 'feColorMatrix', 'feComponentTransfer',
  'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG',
  'feFuncR', 'feGaussianBlur', 'feMerge', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'marker',
];
const SVG_ATTRS = [
  'xmlns', 'xmlns:xlink', 'id', 'viewBox', 'width', 'height', 'x', 'y', 'x1', 'x2',
  'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'transform', 'opacity',
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity',
  'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray',
  'stroke-dashoffset', 'clip-path', 'clip-rule', 'mask', 'filter', 'marker-start',
  'marker-mid', 'marker-end', 'href', 'xlink:href', 'preserveAspectRatio',
  'gradientUnits', 'gradientTransform', 'spreadMethod', 'fx', 'fy', 'fr',
  'offset', 'stop-color', 'stop-opacity', 'patternUnits', 'patternContentUnits',
  'patternTransform', 'maskUnits', 'maskContentUnits', 'clipPathUnits',
  'markerWidth', 'markerHeight', 'refX', 'refY', 'orient', 'markerUnits',
  'font-size', 'font-family', 'font-weight', 'font-style', 'text-anchor',
  'dominant-baseline', 'dx', 'dy', 'rotate', 'textLength', 'lengthAdjust',
  'startOffset', 'method', 'spacing', 'xml:space', 'color', 'color-interpolation',
  'color-interpolation-filters', 'vector-effect', 'in', 'in2', 'result',
  'stdDeviation', 'mode', 'type', 'values', 'operator', 'k1', 'k2', 'k3', 'k4',
  'slope', 'intercept', 'amplitude', 'exponent', 'tableValues', 'scale',
  'xChannelSelector', 'yChannelSelector', 'flood-color', 'flood-opacity',
  'lighting-color', 'surfaceScale', 'diffuseConstant', 'specularConstant',
  'specularExponent', 'azimuth', 'elevation', 'pointsAtX', 'pointsAtY',
  'pointsAtZ', 'limitingConeAngle', 'baseFrequency', 'numOctaves', 'seed',
  'stitchTiles', 'radius', 'order', 'kernelMatrix', 'divisor', 'bias', 'targetX',
  'targetY', 'edgeMode', 'kernelUnitLength', 'preserveAlpha', 'filterUnits',
  'primitiveUnits',
];
const fragment = /^#[A-Za-z_][\w:.-]*$/;
const localPaint = /^url\(\s*['"]?(#[A-Za-z_][\w:.-]*)['"]?\s*\)$/i;
const resourceAttrs = new Set(['clip-path', 'mask', 'filter', 'marker-start', 'marker-mid', 'marker-end']);
const colorAttrs = new Set(['fill', 'stroke', 'color', 'stop-color', 'flood-color', 'lighting-color']);
const staticColor = /^(?:[a-z]+|#[\da-f]{3,8}|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+/-]+\))$/i;

export function parseSvg(input: string): XMLDocument {
  const doc = new DOMParser().parseFromString(input, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg' ||
      (doc.documentElement.namespaceURI && doc.documentElement.namespaceURI !== SVG_NS) || doc.doctype) {
    throw new Error('Invalid SVG: use a single SVG root without a DOCTYPE.');
  }
  return doc;
}

export function sanitizeSvg(input: string): XMLDocument {
  const doc = parseSvg(input);
  // DOMPurify performs the security boundary after XML parsing. A dedicated
  // instance prevents policy hooks from leaking into Markdown sanitization.
  const purify = createDOMPurify(window);
  purify.addHook('uponSanitizeAttribute', (_node, data) => {
    const name = data.attrName.toLowerCase();
    const value = data.attrValue.trim();
    if (name === 'href' || name === 'xlink:href') data.keepAttr = fragment.test(value);
    if (resourceAttrs.has(name)) data.keepAttr = value === 'none' || localPaint.test(value);
    if (colorAttrs.has(name)) data.keepAttr = staticColor.test(value) || localPaint.test(value);
    // CSS escapes cannot be used to disguise resource functions. style and all
    // other URL-bearing attributes are absent from the allowlist.
    if (value.includes('\\')) data.keepAttr = false;
  });
  const clean = purify.sanitize(new XMLSerializer().serializeToString(doc.documentElement), {
    ALLOWED_TAGS: SVG_TAGS,
    ALLOWED_ATTR: SVG_ATTRS,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    NAMESPACE: SVG_NS,
    PARSER_MEDIA_TYPE: 'application/xhtml+xml',
  });
  const result = parseSvg(clean);
  result.documentElement.setAttribute('xmlns', SVG_NS);
  return result;
}

export function sanitizeMarkdownHtml(html: string): string {
  const purify = createDOMPurify(window);
  purify.addHook('afterSanitizeAttributes', (node) => {
    if (node.nodeName.toLowerCase() !== 'a') return;
    const link = node as HTMLAnchorElement;
    const href = link.getAttribute('href') ?? '';
    let allowed = fragment.test(href);
    try {
      // Absolute HTTP(S)/mailto links require an explicit user click.
      allowed ||= /^(https?:|mailto:)/i.test(href) && ['http:', 'https:', 'mailto:'].includes(new URL(href).protocol);
    } catch { /* Invalid URLs lose their href. */ }
    if (!allowed) link.removeAttribute('href');
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.setAttribute('referrerpolicy', 'no-referrer');
  });
  return purify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong',
      'em', 'del', 'blockquote', 'ul', 'ol', 'li', 'pre', 'code', 'a', 'table',
      'thead', 'tbody', 'tr', 'th', 'td', 'input'],
    ALLOWED_ATTR: ['href', 'title', 'class', 'align', 'type', 'checked', 'disabled', 'start'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
}
