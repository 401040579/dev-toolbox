export type DraftStatus = 'empty' | 'pending' | 'saved' | 'tooLarge' | 'unavailable';
export const DRAFT_PREFIX = 'dev-toolbox-draft-v1:';
export const DRAFT_SETTINGS_KEY = 'dev-toolbox-drafts-enabled';
export const MAX_DRAFT_CHARS = 524_288;
const drafts = new Map<string, Record<string, unknown>>();
const statuses = new Map<string, DraftStatus>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();
let enabled = true;
try { enabled = localStorage.getItem(DRAFT_SETTINGS_KEY) !== '0'; } catch { /* Session use remains available. */ }

const notify = () => listeners.forEach((listener) => listener());
export const subscribeDrafts = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const draftsEnabled = () => enabled;
export const getDraftStatus = (toolId: string): DraftStatus => statuses.get(toolId) ?? 'empty';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

// Validate persisted data against the actual control's initial shape. Never merge
// arbitrary object keys into application state, or restore files/results.
export function isCompatibleDraft(value: unknown, initial: unknown, allowed?: readonly unknown[], depth = 0): boolean {
  if (depth > 12 || (allowed && !allowed.includes(value))) return false;
  if (typeof initial === 'string') return typeof value === 'string';
  if (typeof initial === 'boolean') return typeof value === 'boolean';
  if (typeof initial === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (initial === null) return value === null;
  if (Array.isArray(initial)) return Array.isArray(value) && value.length <= 1000 &&
    value.every((item) => initial.length > 0 && isCompatibleDraft(item, initial[0], undefined, depth + 1));
  if (!isPlainObject(initial) || !isPlainObject(value)) return false;
  const keys = Object.keys(initial);
  return Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key) &&
    isCompatibleDraft(value[key], initial[key], undefined, depth + 1));
}

export function readToolDraft(toolId: string): Record<string, unknown> {
  if (!enabled) return {};
  const cached = drafts.get(toolId);
  if (cached) return cached;
  let fields: Record<string, unknown> = {};
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + toolId);
    if (raw && raw.length <= MAX_DRAFT_CHARS) {
      const data: unknown = JSON.parse(raw);
      if (isPlainObject(data) && data.version === 1 && isPlainObject(data.fields)) {
        fields = data.fields;
        statuses.set(toolId, 'saved');
      }
    }
  } catch { statuses.set(toolId, 'unavailable'); }
  drafts.set(toolId, fields);
  return fields;
}

export function flushToolDraft(toolId: string) {
  const timer = timers.get(toolId);
  if (timer) clearTimeout(timer);
  timers.delete(toolId);
  if (!enabled || !drafts.has(toolId) || getDraftStatus(toolId) !== 'pending') return;
  try {
    const raw = JSON.stringify({ version: 1, fields: drafts.get(toolId) });
    if (raw.length > MAX_DRAFT_CHARS) {
      // Remove the stale durable version so refreshing cannot silently restore
      // an older input after the current content exceeded the save budget.
      localStorage.removeItem(DRAFT_PREFIX + toolId);
      statuses.set(toolId, 'tooLarge');
    } else {
      localStorage.setItem(DRAFT_PREFIX + toolId, raw);
      statuses.set(toolId, 'saved');
    }
  } catch { statuses.set(toolId, 'unavailable'); }
  notify();
}

export function writeDraftField(toolId: string, field: string, value: unknown) {
  if (!enabled) return;
  const fields = readToolDraft(toolId);
  drafts.set(toolId, { ...fields, [field]: value });
  statuses.set(toolId, 'pending');
  const timer = timers.get(toolId);
  if (timer) clearTimeout(timer);
  timers.set(toolId, setTimeout(() => flushToolDraft(toolId), 300));
  notify();
}

export function clearToolDraft(toolId: string): boolean {
  try { localStorage.removeItem(DRAFT_PREFIX + toolId); }
  catch { statuses.set(toolId, 'unavailable'); notify(); return false; }
  const timer = timers.get(toolId);
  if (timer) clearTimeout(timer);
  timers.delete(toolId);
  drafts.delete(toolId);
  statuses.delete(toolId);
  notify();
  return true;
}

export function clearAllDrafts(): boolean {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
      .filter((key): key is string => key?.startsWith(DRAFT_PREFIX) === true);
    for (const key of keys) localStorage.removeItem(key);
  } catch { return false; }
  timers.forEach(clearTimeout);
  timers.clear(); drafts.clear(); statuses.clear(); notify();
  return true;
}

export function setDraftsEnabled(next: boolean): boolean {
  enabled = next;
  let success = true;
  try { localStorage.setItem(DRAFT_SETTINGS_KEY, next ? '1' : '0'); } catch { success = false; }
  if (!next) {
    if (!clearAllDrafts()) success = false;
    timers.forEach(clearTimeout); timers.clear(); drafts.clear(); statuses.clear();
  }
  notify();
  return success;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => [...timers.keys()].forEach(flushToolDraft));
}
