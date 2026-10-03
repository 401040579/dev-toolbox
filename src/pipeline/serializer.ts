import LZString from 'lz-string';
import type { PipelineNode } from './types';
import { getTransform } from '@/tools/registry';

interface SerializedPipeline {
  nodes: Array<{ transformId: string; options: Record<string, unknown> }>;
  input: string;
}

export function serializePipeline(nodes: PipelineNode[], input: string): string {
  const data: SerializedPipeline = {
    nodes: nodes.map((n) => ({ transformId: n.transformId, options: n.options })),
    input,
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(data));
}

export function deserializePipeline(encoded: string): SerializedPipeline | null {
  try {
    if (encoded.length > 8000) return null;
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json || json.length > 250_000) return null;
    const data = JSON.parse(json);
    if (!data || typeof data.input !== 'string' || !Array.isArray(data.nodes) || data.nodes.length > 32) return null;
    const nodes: SerializedPipeline['nodes'] = [];
    for (const node of data.nodes) {
      if (!node || typeof node.transformId !== 'string' || !node.options ||
          typeof node.options !== 'object' || Array.isArray(node.options)) return null;
      const transform = getTransform(node.transformId);
      if (!transform) return null;
      const options: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(node.options)) {
        const option = transform.options?.find((item) => item.key === key);
        if (!option) return null;
        if (option.type === 'boolean' && typeof value !== 'boolean') return null;
        if (option.type === 'string' && typeof value !== 'string') return null;
        if (option.type === 'select' && typeof value !== 'string' && !(typeof value === 'number' && Number.isFinite(value))) return null;
        if (option.type === 'select' && !option.choices?.some((item) => item.value === String(value))) return null;
        options[key] = value;
      }
      nodes.push({ transformId: transform.id, options });
    }
    return { nodes, input: data.input };
  } catch {
    return null;
  }
}

export function getPipelineShareUrl(nodes: PipelineNode[], input: string): string {
  const encoded = serializePipeline(nodes, input);
  const url = `${window.location.origin}${import.meta.env.BASE_URL}pipeline#config=${encoded}`;
  return url.length > 8000 || !deserializePipeline(encoded) ? '' : url;
}
