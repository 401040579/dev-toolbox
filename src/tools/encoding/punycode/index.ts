import type { ToolDefinition } from '@/tools/types';

// Punycode implementation (RFC 3492)
const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const DELIMITER = '-';

function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  delta = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  delta += Math.floor(delta / numPoints);
  let k = 0;
  while (delta > ((BASE - TMIN) * TMAX) >> 1) {
    delta = Math.floor(delta / (BASE - TMIN));
    k += BASE;
  }
  return Math.floor(k + ((BASE - TMIN + 1) * delta) / (delta + SKEW));
}

function digitToBasic(digit: number): number {
  return digit + 22 + 75 * (digit < 26 ? 1 : 0);
}

function basicToDigit(codePoint: number): number {
  if (codePoint - 48 < 10) return codePoint - 22;
  if (codePoint - 65 < 26) return codePoint - 65;
  if (codePoint - 97 < 26) return codePoint - 97;
  return BASE;
}

function punycodeEncode(input: string): string {
  const output: number[] = [];
  const inputArr = Array.from(input);
  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;

  // Handle basic code points
  for (const char of inputArr) {
    const code = char.charCodeAt(0);
    if (code < 128) {
      output.push(code);
    }
  }

  const basicLength = output.length;
  let handledCPCount = basicLength;

  if (basicLength > 0) {
    output.push(DELIMITER.charCodeAt(0));
  }

  while (handledCPCount < inputArr.length) {
    let m = Infinity;
    for (const char of inputArr) {
      const code = char.charCodeAt(0);
      if (code >= n && code < m) {
        m = code;
      }
    }

    delta += (m - n) * (handledCPCount + 1);
    n = m;

    for (const char of inputArr) {
      const code = char.charCodeAt(0);
      if (code < n) {
        delta++;
      }
      if (code === n) {
        let q = delta;
        for (let k = BASE; ; k += BASE) {
          const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
          if (q < t) break;
          output.push(digitToBasic(t + ((q - t) % (BASE - t))));
          q = Math.floor((q - t) / (BASE - t));
        }
        output.push(digitToBasic(q));
        bias = adapt(delta, handledCPCount + 1, handledCPCount === basicLength);
        delta = 0;
        handledCPCount++;
      }
    }
    delta++;
    n++;
  }

  return String.fromCharCode(...output);
}

function punycodeDecode(input: string): string {
  const output: number[] = [];
  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;

  let basic = input.lastIndexOf(DELIMITER);
  if (basic < 0) basic = 0;

  for (let j = 0; j < basic; j++) {
    const code = input.charCodeAt(j);
    if (code >= 128) throw new Error('Invalid input');
    output.push(code);
  }

  for (let index = basic > 0 ? basic + 1 : 0; index < input.length; ) {
    const oldi = i;
    let w = 1;
    for (let k = BASE; ; k += BASE) {
      if (index >= input.length) throw new Error('Invalid input');
      const digit = basicToDigit(input.charCodeAt(index++));
      if (digit >= BASE) throw new Error('Invalid input');
      i += digit * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
    }
    const out = output.length + 1;
    bias = adapt(i - oldi, out, oldi === 0);
    n += Math.floor(i / out);
    i %= out;
    output.splice(i++, 0, n);
  }

  return String.fromCodePoint(...output);
}

function toAscii(domain: string): string {
  return domain
    .split('.')
    .map((label) => {
      if (/[^\x00-\x7F]/.test(label)) {
        return 'xn--' + punycodeEncode(label);
      }
      return label;
    })
    .join('.');
}

function toUnicode(domain: string): string {
  return domain
    .split('.')
    .map((label) => {
      if (label.startsWith('xn--')) {
        return punycodeDecode(label.slice(4));
      }
      return label;
    })
    .join('.');
}

const tool: ToolDefinition = {
  id: 'punycode',
  name: 'Punycode Encode/Decode',
  description: 'Convert internationalized domain names (IDN) using Punycode',
  category: 'encoding',
  keywords: ['punycode', 'idn', 'domain', 'international', 'unicode', 'xn--'],
  icon: 'Globe',
  component: () => import('./Punycode'),
  transforms: [
    {
      id: 'punycode-encode',
      name: 'Domain → Punycode',
      description: 'Convert Unicode domain to ASCII (Punycode)',
      inputType: 'string',
      outputType: 'string',
      transform: toAscii,
    },
    {
      id: 'punycode-decode',
      name: 'Punycode → Domain',
      description: 'Convert Punycode to Unicode domain',
      inputType: 'string',
      outputType: 'string',
      transform: toUnicode,
    },
  ],
};

export default tool;
