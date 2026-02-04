import { describe, it, expect, beforeEach } from 'vitest';
import { serializePipeline, deserializePipeline } from './serializer';
import { usePipelineStore } from './store';
import { executePipeline } from './engine';
import type { PipelineNode } from './types';

// Import registry to register transforms
import '@/tools/registry';

describe('Pipeline Serializer', () => {
  const sampleNodes: PipelineNode[] = [
    { id: 'node-1', transformId: 'base64-encode', options: {}, status: 'idle' },
    { id: 'node-2', transformId: 'json-prettify', options: { indent: 2 }, status: 'idle' },
  ];

  it('serializes and deserializes roundtrip', () => {
    const encoded = serializePipeline(sampleNodes, 'hello world');
    const decoded = deserializePipeline(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.input).toBe('hello world');
    expect(decoded!.nodes).toHaveLength(2);
    expect(decoded!.nodes[0]!.transformId).toBe('base64-encode');
    expect(decoded!.nodes[1]!.transformId).toBe('json-prettify');
    expect(decoded!.nodes[1]!.options).toEqual({ indent: 2 });
  });

  it('strips runtime state during serialization', () => {
    const nodesWithState: PipelineNode[] = [
      { id: 'node-1', transformId: 'base64-encode', options: {}, status: 'success', output: 'result' },
    ];
    const encoded = serializePipeline(nodesWithState, 'test');
    const decoded = deserializePipeline(encoded);

    expect(decoded!.nodes[0]).not.toHaveProperty('status');
    expect(decoded!.nodes[0]).not.toHaveProperty('output');
    expect(decoded!.nodes[0]).not.toHaveProperty('id');
  });

  it('returns null for invalid encoded string', () => {
    expect(deserializePipeline('garbage')).toBeNull();
  });

  it('returns null for valid LZ but invalid structure', async () => {
    const lz = (await import('lz-string')).default;
    const encoded = lz.compressToEncodedURIComponent('{"not":"pipeline"}');
    // nodes is not an array
    expect(deserializePipeline(encoded)).toBeNull();
  });
});

describe('Pipeline Store', () => {
  beforeEach(() => {
    usePipelineStore.getState().clearPipeline();
  });

  it('adds nodes', () => {
    usePipelineStore.getState().addNode('base64-encode');
    usePipelineStore.getState().addNode('json-prettify');
    expect(usePipelineStore.getState().nodes).toHaveLength(2);
  });

  it('removes nodes', () => {
    usePipelineStore.getState().addNode('base64-encode');
    const id = usePipelineStore.getState().nodes[0]!.id;
    usePipelineStore.getState().removeNode(id);
    expect(usePipelineStore.getState().nodes).toHaveLength(0);
  });

  it('sets input', () => {
    usePipelineStore.getState().setInput('test input');
    expect(usePipelineStore.getState().input).toBe('test input');
  });

  it('moves nodes', () => {
    usePipelineStore.getState().addNode('base64-encode');
    usePipelineStore.getState().addNode('json-prettify');
    const ids = usePipelineStore.getState().nodes.map((n) => n.transformId);
    expect(ids).toEqual(['base64-encode', 'json-prettify']);

    usePipelineStore.getState().moveNode(0, 1);
    const movedIds = usePipelineStore.getState().nodes.map((n) => n.transformId);
    expect(movedIds).toEqual(['json-prettify', 'base64-encode']);
  });

  it('sets node options', () => {
    usePipelineStore.getState().addNode('json-prettify');
    const id = usePipelineStore.getState().nodes[0]!.id;
    usePipelineStore.getState().setNodeOption(id, 'indent', 4);
    expect(usePipelineStore.getState().nodes[0]!.options).toEqual({ indent: 4 });
  });

  it('loads pipeline config', () => {
    usePipelineStore.getState().loadPipeline(
      [
        { transformId: 'base64-encode', options: {} },
        { transformId: 'to-uppercase', options: {} },
      ],
      'initial input',
    );
    expect(usePipelineStore.getState().nodes).toHaveLength(2);
    expect(usePipelineStore.getState().input).toBe('initial input');
  });

  it('clears pipeline', () => {
    usePipelineStore.getState().addNode('base64-encode');
    usePipelineStore.getState().setInput('test');
    usePipelineStore.getState().clearPipeline();
    expect(usePipelineStore.getState().nodes).toHaveLength(0);
    expect(usePipelineStore.getState().input).toBe('');
  });
});

describe('Pipeline Engine', () => {
  beforeEach(() => {
    usePipelineStore.getState().clearPipeline();
  });

  it('executes a single transform', async () => {
    usePipelineStore.getState().setInput('hello');
    usePipelineStore.getState().addNode('base64-encode');

    await executePipeline();

    const nodes = usePipelineStore.getState().nodes;
    expect(nodes[0]!.status).toBe('success');
    expect(nodes[0]!.output).toBe('aGVsbG8=');
  });

  it('chains transforms sequentially', async () => {
    usePipelineStore.getState().setInput('hello world');
    usePipelineStore.getState().addNode('to-uppercase');
    usePipelineStore.getState().addNode('base64-encode');

    await executePipeline();

    const nodes = usePipelineStore.getState().nodes;
    expect(nodes[0]!.status).toBe('success');
    expect(nodes[0]!.output).toBe('HELLO WORLD');
    expect(nodes[1]!.status).toBe('success');
    // Base64 of "HELLO WORLD"
    expect(nodes[1]!.output).toBe(btoa('HELLO WORLD'));
  });

  it('propagates upstream errors', async () => {
    usePipelineStore.getState().setInput('not-valid-base64!!!');
    usePipelineStore.getState().addNode('base64-decode');
    usePipelineStore.getState().addNode('to-uppercase');

    await executePipeline();

    const nodes = usePipelineStore.getState().nodes;
    expect(nodes[0]!.status).toBe('error');
    expect(nodes[1]!.status).toBe('upstream-error');
  });

  it('handles unknown transform', async () => {
    usePipelineStore.getState().setInput('test');
    usePipelineStore.getState().addNode('nonexistent-transform');

    await executePipeline();

    const nodes = usePipelineStore.getState().nodes;
    expect(nodes[0]!.status).toBe('error');
    expect(nodes[0]!.error).toContain('not found');
  });

  it('does nothing with empty pipeline', async () => {
    usePipelineStore.getState().setInput('test');
    await executePipeline();
    // No errors thrown
  });
});
