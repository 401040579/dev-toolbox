export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Array<{ transformId: string; options: Record<string, unknown> }>;
  sampleInput: string;
}

export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'sms-smart-encoding',
    name: 'SMS → Smart Encoding',
    description: 'Normalize smart punctuation before estimating SMS segments',
    nodes: [{ transformId: 'sms-smart-encode', options: {} }],
    sampleInput: 'Order DEMO-1042 is “ready”—collect at the demo desk. Reply “YES” to confirm your pickup time. Thank you!',
  },
  {
    id: 'base64-decode-prettify',
    name: 'Base64 → JSON Pretty',
    description: 'Decode Base64, then format as pretty JSON',
    nodes: [
      { transformId: 'base64-decode', options: {} },
      { transformId: 'json-prettify', options: {} },
    ],
    sampleInput: 'eyJldmVudCI6Im9yZGVyLnJlYWR5Iiwib3JkZXJJZCI6IkRFTU8tMTA0MiIsInN0b3JlSWQiOiJERU1PLVNUT1JFIiwidG90YWwiOjEyLjUsImN1cnJlbmN5IjoiVVNEIn0=',
  },
  {
    id: 'json-minify-base64',
    name: 'JSON Minify → Base64',
    description: 'Minify JSON then encode to Base64',
    nodes: [
      { transformId: 'json-minify', options: {} },
      { transformId: 'base64-encode', options: {} },
    ],
    sampleInput: '{\n  "orderId": "DEMO-1042",\n  "status": "ready",\n  "storeId": "DEMO-STORE"\n}',
  },
  {
    id: 'text-to-sha256',
    name: 'Text → SHA-256',
    description: 'Hash text input with SHA-256',
    nodes: [{ transformId: 'hash-sha256', options: {} }],
    sampleInput: 'DEMO-1042|ready|12.50|USD',
  },
];
