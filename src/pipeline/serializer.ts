import LZString from 'lz-string';
import type { PipelineNode } from './types';

interface SerializedPipeline {
  nodes: Array<{ transformId: string; options: Record<string, unknown> }>;
  input: string;
}

export function serializePipeline(nodes: PipelineNode[], input: string): string {
  const data: SerializedPipeline = {
    nodes: nodes.map((n) => ({ transformId: n.transformId, options: n.options })),
    input,
  };
  const json = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(json);
}

export function deserializePipeline(encoded: string): SerializedPipeline | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const data = JSON.parse(json) as SerializedPipeline;
    if (!Array.isArray(data.nodes)) return null;
    return data;
  } catch {
    return null;
  }
}

export function getPipelineShareUrl(nodes: PipelineNode[], input: string): string {
  const encoded = serializePipeline(nodes, input);
  const url = `${window.location.origin}${import.meta.env.BASE_URL}pipeline#config=${encoded}`;

  if (url.length > 8000) {
    return '';
  }

  return url;
}
