import { create } from 'zustand';
import type { PipelineNode } from './types';

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
    set((s) => ({
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
