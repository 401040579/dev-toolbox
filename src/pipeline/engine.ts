import { getTransform } from '@/tools/registry';
import { usePipelineStore } from './store';

let runId = 0;

export async function executePipeline() {
  const currentRun = ++runId;
  const { nodes, input, updateNodeResult, setAllNodeStatuses } = usePipelineStore.getState();

  if (nodes.length === 0) return;
  const signature = JSON.stringify(nodes.map(({ id, transformId, options }) => ({ id, transformId, options })));
  const isCurrent = () => {
    const state = usePipelineStore.getState();
    return currentRun === runId && state.input === input &&
      JSON.stringify(state.nodes.map(({ id, transformId, options }) => ({ id, transformId, options }))) === signature;
  };

  setAllNodeStatuses('idle');

  let currentInput = input;
  let hasUpstreamError = false;

  for (const node of nodes) {
    if (!isCurrent()) return;
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
      if (!isCurrent()) return;
      updateNodeResult(node.id, { status: 'success', output: result });
      currentInput = result;
    } catch (e) {
      if (!isCurrent()) return;
      const message = e instanceof Error ? e.message : 'Unknown error';
      updateNodeResult(node.id, { status: 'error', error: message });
      hasUpstreamError = true;
    }
  }
}
