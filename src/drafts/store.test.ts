// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAllDrafts, clearToolDraft, DRAFT_PREFIX, DRAFT_SETTINGS_KEY, draftsEnabled, flushToolDraft, getDraftStatus, isCompatibleDraft, MAX_DRAFT_CHARS, readToolDraft, setDraftsEnabled, writeDraftField } from './store';

beforeEach(() => { vi.restoreAllMocks(); setDraftsEnabled(true); clearAllDrafts(); localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { vi.restoreAllMocks(); clearAllDrafts(); vi.useRealTimers(); });

describe('durable tool drafts', () => {
  it('isolates tools, debounces edits and flushes the latest input on page exit', () => {
    writeDraftField('base64', 'input', 'first');
    writeDraftField('base64', 'input', 'latest');
    writeDraftField('base64', 'mode', 'decode');
    writeDraftField('json-formatter', 'input', '{"a":1}');
    expect(getDraftStatus('base64')).toBe('pending');
    expect(localStorage.getItem(DRAFT_PREFIX + 'base64')).toBeNull();
    window.dispatchEvent(new Event('pagehide'));
    expect(JSON.parse(localStorage.getItem(DRAFT_PREFIX + 'base64')!).fields).toEqual({ input: 'latest', mode: 'decode' });
    expect(readToolDraft('json-formatter')).toEqual({ input: '{"a":1}' });
    expect(getDraftStatus('base64')).toBe('saved');
  });

  it('clearing cancels pending writes and does not clear saved Pipelines or preferences', () => {
    localStorage.setItem('dev-toolbox-pipelines', 'existing');
    writeDraftField('base64', 'input', 'discard');
    writeDraftField('json-formatter', 'input', 'keep');
    expect(clearToolDraft('base64')).toBe(true);
    vi.runAllTimers();
    expect(localStorage.getItem(DRAFT_PREFIX + 'base64')).toBeNull();
    expect(readToolDraft('base64')).toEqual({});
    expect(readToolDraft('json-formatter')).toEqual({ input: 'keep' });
    expect(clearAllDrafts()).toBe(true);
    expect(localStorage.getItem('dev-toolbox-pipelines')).toBe('existing');
  });

  it('disable clears durable drafts and pending edits, and persists the preference', () => {
    writeDraftField('base64', 'input', 'discard');
    expect(setDraftsEnabled(false)).toBe(true);
    vi.runAllTimers();
    writeDraftField('base64', 'input', 'do not store');
    expect(draftsEnabled()).toBe(false);
    expect(readToolDraft('base64')).toEqual({});
    expect(localStorage.getItem(DRAFT_PREFIX + 'base64')).toBeNull();
    expect(localStorage.getItem(DRAFT_SETTINGS_KEY)).toBe('0');
  });

  it('storage denial retains session edits without claiming a durable save or deletion', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    writeDraftField('base64', 'input', 'session only');
    flushToolDraft('base64');
    expect(readToolDraft('base64').input).toBe('session only');
    expect(getDraftStatus('base64')).toBe('unavailable');
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denied'); });
    expect(clearToolDraft('base64')).toBe(false);
    expect(readToolDraft('base64').input).toBe('session only');
    expect(setDraftsEnabled(false)).toBe(false);
  });

  it('oversized edits remain available in the session and remove the stale durable draft', () => {
    writeDraftField('logs', 'input', 'old'); flushToolDraft('logs');
    const large = 'x'.repeat(MAX_DRAFT_CHARS);
    writeDraftField('logs', 'input', large); flushToolDraft('logs');
    expect(getDraftStatus('logs')).toBe('tooLarge');
    expect(readToolDraft('logs').input).toBe(large);
    expect(localStorage.getItem(DRAFT_PREFIX + 'logs')).toBeNull();
  });

  it('rejects corrupt records, version mismatches, invalid option values and unexpected shapes', () => {
    for (const [id, raw] of [['bad', '{broken'], ['future', '{"version":2,"fields":{"input":"wrong"}}'], ['array', '{"version":1,"fields":[]}']]) {
      localStorage.setItem(DRAFT_PREFIX + id, raw!);
      expect(readToolDraft(id!)).toEqual({});
    }
    expect(isCompatibleDraft('broken', 'encode', ['encode', 'decode'])).toBe(false);
    expect(isCompatibleDraft('false', false)).toBe(false);
    expect(isCompatibleDraft(Infinity, 1)).toBe(false);
    expect(isCompatibleDraft({ owner: null }, { owner: { read: true } })).toBe(false);
    expect(isCompatibleDraft(JSON.parse('{"__proto__":{"polluted":true}}'), { input: '' })).toBe(false);
    expect(isCompatibleDraft({ owner: { read: false } }, { owner: { read: true } })).toBe(true);
  });
});
