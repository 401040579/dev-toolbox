export type PipelineNodeStatus = 'idle' | 'running' | 'success' | 'error' | 'upstream-error';

export interface PipelineNode {
  id: string;
  transformId: string;
  options: Record<string, unknown>;
  output?: string;
  error?: string;
  status: PipelineNodeStatus;
}

export interface PipelineState {
  nodes: PipelineNode[];
  input: string;
}
