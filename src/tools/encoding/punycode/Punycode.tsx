import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolLayout } from '@/components/tool-layout/ToolLayout';
import { CopyButton } from '@/components/copy-button/CopyButton';

type Mode = 'encode' | 'decode';

// Punycode constants
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

  for (const char of inputArr) {
    const code = char.charCodeAt(0);
    if (code < 128) output.push(code);
  }

  const basicLength = output.length;
  let handledCPCount = basicLength;

  if (basicLength > 0) output.push(DELIMITER.charCodeAt(0));

  while (handledCPCount < inputArr.length) {
    let m = Infinity;
    for (const char of inputArr) {
      const code = char.charCodeAt(0);
      if (code >= n && code < m) m = code;
    }

    delta += (m - n) * (handledCPCount + 1);
    n = m;

    for (const char of inputArr) {
      const code = char.charCodeAt(0);
      if (code < n) delta++;
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

export default function Punycode() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: null };
    try {
      if (mode === 'encode') {
        return { output: toAscii(input), error: null };
      } else {
        return { output: toUnicode(input), error: null };
      }
    } catch {
      return { output: '', error: t('tools.punycode.error') };
    }
  }, [input, mode, t]);

  const examples = [
    { unicode: '中文.com', punycode: 'xn--fiq228c.com' },
    { unicode: 'münchen.de', punycode: 'xn--mnchen-3ya.de' },
    { unicode: '日本語.jp', punycode: 'xn--wgv71a119e.jp' },
    { unicode: 'россия.рф', punycode: 'xn--h1alffa9f.xn--p1ai' },
  ];

  return (
    <ToolLayout
      toolId="punycode"
      title={t('tools.punycode.title')}
      description={t('tools.punycode.description')}
      actions={
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setMode('encode')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'encode'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.punycode.encode')}
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'decode'
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('tools.punycode.decode')}
          </button>
        </div>
      }
      input={
        <div className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'encode'
                ? t('tools.punycode.encodePlaceholder')
                : t('tools.punycode.decodePlaceholder')
            }
            className="w-full h-[120px] resize-none bg-transparent font-mono text-sm outline-none"
            spellCheck={false}
          />
          <div className="border-t border-border pt-4">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {t('tools.punycode.examples')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setInput(mode === 'encode' ? ex.unicode : ex.punycode)}
                  className="text-left p-2 rounded bg-surface-alt hover:bg-surface border border-transparent hover:border-border transition-colors"
                >
                  <div className="font-mono text-sm text-text-primary">{ex.unicode}</div>
                  <div className="font-mono text-xs text-text-muted">{ex.punycode}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      }
      output={
        <div className="relative h-full">
          {error ? (
            <p className="text-error text-sm">{error}</p>
          ) : output ? (
            <>
              <div className="absolute right-0 top-0">
                <CopyButton text={output} />
              </div>
              <pre className="font-mono text-sm whitespace-pre-wrap break-all pr-10">{output}</pre>
            </>
          ) : (
            <p className="text-text-muted text-sm">{t('common.outputPlaceholder')}</p>
          )}
        </div>
      }
    />
  );
}
