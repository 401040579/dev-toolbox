import { getTransform } from '@/tools/registry';
import { usePipelineStore } from './store';

export async function executePipeline() {
  const { nodes, input, updateNodeResult, setAllNodeStatuses } = usePipelineStore.getState();

  if (nodes.length === 0) return;

  setAllNodeStatuses('idle');

  let currentInput = input;
  let hasUpstreamError = false;

  for (const node of nodes) {
    if (hasUpstreamError) {
      updateNodeResult(node.id, { status: 'upstream-error', error: 'Upstream error' });
      continue;
    }

    const transform = getTransform(node.transformId);
    if (!transform) {
      updateNodeResult(node.id, { status: 'error', error: `Transform "${node.transformId}" not found` });
      hasUpstreamError = true;
      continue;
    }

    updateNodeResult(node.id, { status: 'running' });

    try {
      const result = await transform.transform(currentInput, node.options);
      updateNodeResult(node.id, { status: 'success', output: result });
      currentInput = result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      updateNodeResult(node.id, { status: 'error', error: message });
      hasUpstreamError = true;
    }
  }
}
