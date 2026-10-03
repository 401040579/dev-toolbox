// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { usePipelineStore, useSavedPipelinesStore } from './store';

beforeEach(() => {
  localStorage.clear();
  useSavedPipelinesStore.setState({ saved: [] });
  usePipelineStore.getState().clearPipeline();
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('does not report a Pipeline as saved when durable storage fails', () => {
  usePipelineStore.getState().addNode('base64-encode');
  const nodes = usePipelineStore.getState().nodes;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError'); });
  expect(() => useSavedPipelinesStore.getState().savePipeline('demo', nodes, 'test')).toThrow();
  expect(useSavedPipelinesStore.getState().saved).toEqual([]);
});

it('persists compatible records with unique IDs and keeps data if deletion fails', () => {
  usePipelineStore.getState().addNode('base64-encode');
  const nodes = usePipelineStore.getState().nodes;
  useSavedPipelinesStore.getState().savePipeline('one', nodes, 'first');
  useSavedPipelinesStore.getState().savePipeline('two', nodes, 'second');
  const saved = useSavedPipelinesStore.getState().saved;
  expect(new Set(saved.map((entry) => entry.id)).size).toBe(2);
  expect(JSON.parse(localStorage.getItem('dev-toolbox-pipelines')!).state.saved).toEqual(saved);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
  expect(() => useSavedPipelinesStore.getState().deleteSavedPipeline(saved[0]!.id)).toThrow();
  expect(useSavedPipelinesStore.getState().saved).toEqual(saved);
});

it('saves when crypto.randomUUID is unavailable in an insecure browser context', () => {
  vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
  usePipelineStore.getState().addNode('base64-encode');
  useSavedPipelinesStore.getState().savePipeline('local', usePipelineStore.getState().nodes, 'demo');
  expect(JSON.parse(localStorage.getItem('dev-toolbox-pipelines')!).state.saved[0].name).toBe('local');
});

it('keeps the same supported step limit in editing and persisted configuration', () => {
  for (let i = 0; i < 40; i++) usePipelineStore.getState().addNode('base64-encode');
  expect(usePipelineStore.getState().nodes).toHaveLength(32);
});
