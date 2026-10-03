import { create } from 'zustand';
import { validatePipeline, MAX_PIPELINE_STEPS } from './serializer';
import type { PipelineNode } from './types';

export interface SavedPipeline {
  id: string;
  name: string;
  nodes: Array<{ transformId: string; options: Record<string, unknown> }>;
  input: string;
  savedAt: number;
}

interface SavedPipelinesStore {
  saved: SavedPipeline[];
  savePipeline: (name: string, nodes: PipelineNode[], input: string) => void;
  deleteSavedPipeline: (id: string) => void;
}

const SAVED_STORAGE_KEY = 'dev-toolbox-pipelines';

function readSavedPipelines(): SavedPipeline[] {
  try {
    const data = JSON.parse(localStorage.getItem(SAVED_STORAGE_KEY) || '{}');
    if (!Array.isArray(data?.state?.saved)) return [];
    return data.state.saved.filter((value: unknown): value is SavedPipeline => {
      if (!value || typeof value !== 'object') return false;
      const entry = value as SavedPipeline;
      if (typeof entry.id !== 'string' || typeof entry.name !== 'string' || typeof entry.savedAt !== 'number' || !Number.isFinite(entry.savedAt)) return false;
      try {
        return Boolean(validatePipeline({ nodes: entry.nodes, input: entry.input }));
      } catch { return false; }
    });
  } catch { return []; }
}

function writeSavedPipelines(saved: SavedPipeline[]) {
  // Preserve the previous persist format. Commit to memory only after durable storage succeeds.
  localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify({ state: { saved }, version: 0 }));
}

export const useSavedPipelinesStore = create<SavedPipelinesStore>((set, get) => ({
  saved: readSavedPipelines(),
  savePipeline: (name, nodes, input) => {
    const config = validatePipeline({ nodes: nodes.map(({ transformId, options }) => ({ transformId, options })), input });
    if (!config) throw new Error('Unsupported saved Pipeline configuration');
    const saved = [{ id: `saved-${Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')}`, name, ...config, savedAt: Date.now() }, ...get().saved];
    writeSavedPipelines(saved);
    set({ saved });
  },
  deleteSavedPipeline: (id) => {
    const saved = get().saved.filter((pipeline) => pipeline.id !== id);
    writeSavedPipelines(saved);
    set({ saved });
  },
}));

interface PipelineStore {
  nodes: PipelineNode[];
  input: string;
  setInput: (input: string) => void;
  addNode: (transformId: string) => void;
  removeNode: (id: string) => void;
  moveNode: (fromIndex: number, toIndex: number) => void;
  setNodeOption: (id: string, key: string, value: unknown) => void;
  updateNodeResult: (id: string, update: Partial<Pick<PipelineNode, 'output' | 'error' | 'status'>>) => void;
  setAllNodeStatuses: (status: PipelineNode['status']) => void;
  clearPipeline: () => void;
  loadPipeline: (nodes: Array<{ transformId: string; options: Record<string, unknown> }>, input: string) => void;
}

let nodeCounter = 0;

export const usePipelineStore = create<PipelineStore>((set) => ({
  nodes: [],
  input: '',

  setInput: (input) => set({ input }),

  addNode: (transformId) =>
    set((s) => s.nodes.length >= MAX_PIPELINE_STEPS ? s : ({
      nodes: [
        ...s.nodes,
        {
          id: `node-${++nodeCounter}`,
          transformId,
          options: {},
          status: 'idle',
        },
      ],
    })),

  removeNode: (id) =>
    set((s) => ({ nodes: s.nodes.filter((n) => n.id !== id) })),

  moveNode: (fromIndex, toIndex) =>
    set((s) => {
      const nodes = [...s.nodes];
      const [moved] = nodes.splice(fromIndex, 1);
      if (moved) nodes.splice(toIndex, 0, moved);
      return { nodes };
    }),

  setNodeOption: (id, key, value) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, options: { ...n.options, [key]: value } } : n,
      ),
    })),

  updateNodeResult: (id, update) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...update } : n)),
    })),

  setAllNodeStatuses: (status) =>
    set((s) => ({
      nodes: s.nodes.map((n) => ({ ...n, status, output: undefined, error: undefined })),
    })),

  clearPipeline: () => set({ nodes: [], input: '' }),

  loadPipeline: (nodeConfigs, input) =>
    set({
      input,
      nodes: nodeConfigs.map((nc) => ({
        id: `node-${++nodeCounter}`,
        transformId: nc.transformId,
        options: nc.options,
        status: 'idle' as const,
      })),
    }),
}));
