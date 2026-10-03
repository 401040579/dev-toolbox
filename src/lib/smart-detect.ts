import { isToolInputWithinLimit } from './tool-handoff';

export type SmartPasteKind = 'json' | 'jwt' | 'timestamp' | 'url' | 'base64' | 'text';

export interface SmartPasteCandidate {
  kind: SmartPasteKind;
  toolId: string;
  reason: 'jsonObject' | 'jsonArray' | 'jwt' | 'seconds' | 'milliseconds' | 'url' | 'base64' | 'text';
  fields: Record<string, unknown>;
}

export interface SmartPasteDetection {
  candidates: SmartPasteCandidate[];
  error?: 'tooLarge';
}

function decodeUtf8Base64(input: string): string {
  const binary = atob(input);
  return new TextDecoder('utf-8', { fatal: true }).decode(
    Uint8Array.from(binary, (character) => character.charCodeAt(0)),
  );
}

function decodeJwtPart(input: string): unknown {
  if (!/^[A-Za-z0-9_-]+$/.test(input) || input.length % 4 === 1) throw new Error('Invalid JWT segment');
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  // Reject non-canonical trailing bits instead of letting atob silently ignore them.
  if (btoa(atob(padded)).replace(/=+$/, '') !== base64) throw new Error('Invalid JWT encoding');
  return JSON.parse(decodeUtf8Base64(padded));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function resemblesJwt(input: string): boolean {
  const parts = input.split('.');
  if (parts.length !== 3) return false;
  try {
    const header = decodeJwtPart(parts[0]!);
    const payload = decodeJwtPart(parts[1]!);
    if (!isRecord(header) || !isRecord(payload) || typeof header.alg !== 'string' || !header.alg) return false;
    const signature = parts[2]!;
    // Unsigned JWTs have an explicitly empty signature. No signature is verified here.
    if (header.alg === 'none') return signature === '';
    if (!/^[A-Za-z0-9_-]+$/.test(signature) || signature.length % 4 === 1) return false;
    const base64 = signature.replace(/-/g, '+').replace(/_/g, '/');
    return btoa(atob(base64 + '='.repeat((4 - base64.length % 4) % 4))).replace(/=+$/, '') === base64;
  } catch {
    return false;
  }
}

function resemblesTextBase64(input: string): boolean {
  // Short words, binary data and malformed/padded encodings cause frequent false positives.
  const compact = input.replace(/[\t\r\n ]/g, '');
  if (compact.length < 8 || compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) return false;
  try {
    const binary = atob(compact);
    if (btoa(binary) !== compact) return false;
    const decoded = decodeUtf8Base64(compact);
    for (const character of decoded) {
      const code = character.charCodeAt(0);
      if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || (code >= 127 && code <= 159)) return false;
    }
    return decoded.length > 0;
  } catch {
    return false;
  }
}

/** Suggestions only: content never causes automatic navigation or clipboard access. */
export function detectSmartPaste(input: string): SmartPasteDetection {
  if (!isToolInputWithinLimit(input)) return { candidates: [], error: 'tooLarge' };
  const trimmed = input.trim();
  if (!trimmed) return { candidates: [] };
  const candidates: SmartPasteCandidate[] = [];

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const value = JSON.parse(trimmed);
      if (value !== null && typeof value === 'object') {
        candidates.push({ kind: 'json', toolId: 'json-formatter', reason: Array.isArray(value) ? 'jsonArray' : 'jsonObject', fields: { input } });
      }
    } catch { /* Invalid JSON remains available as plain text. */ }
  }

  if (resemblesJwt(trimmed)) {
    candidates.push({ kind: 'jwt', toolId: 'jwt-decode', reason: 'jwt', fields: { input: trimmed } });
  }

  // Deliberately narrow: ordinary small integers and fractional values are not guessed as dates.
  if (/^-?[1-9]\d{8,9}$/.test(trimmed) || /^[1-9]\d{12}$/.test(trimmed)) {
    candidates.push({
      kind: 'timestamp', toolId: 'epoch-converter',
      reason: trimmed.length === 13 && !trimmed.startsWith('-') ? 'milliseconds' : 'seconds',
      fields: { input: trimmed, mode: 'epoch-to-date', activeTab: 'converter' },
    });
  }

  if (/^https?:\/\//i.test(trimmed) && !/\s/.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if ((url.protocol === 'https:' || url.protocol === 'http:') && url.hostname) {
        candidates.push({ kind: 'url', toolId: 'url-parser', reason: 'url', fields: { input: trimmed } });
      }
    } catch { /* A URL-like string can still be inspected as text. */ }
  }

  if (resemblesTextBase64(trimmed)) {
    candidates.push({ kind: 'base64', toolId: 'base64', reason: 'base64', fields: { input: trimmed, mode: 'decode' } });
  }

  candidates.push({ kind: 'text', toolId: 'text-stats', reason: 'text', fields: { input } });
  return { candidates };
}
