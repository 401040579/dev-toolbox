export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Array<{ transformId: string; options: Record<string, unknown> }>;
  sampleInput: string;
}

export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'base64-decode-prettify',
    name: 'Base64 → JSON Pretty',
    description: 'Decode Base64, then format as pretty JSON',
    nodes: [
      { transformId: 'base64-decode', options: {} },
      { transformId: 'json-prettify', options: {} },
    ],
    sampleInput: 'eyJuYW1lIjoiRGV2VG9vbGJveCIsInZlcnNpb24iOiIxLjAifQ==',
  },
  {
    id: 'json-minify-base64',
    name: 'JSON Minify → Base64',
    description: 'Minify JSON then encode to Base64',
    nodes: [
      { transformId: 'json-minify', options: {} },
      { transformId: 'base64-encode', options: {} },
    ],
    sampleInput: '{\n  "name": "DevToolbox",\n  "version": "1.0"\n}',
  },
  {
    id: 'text-to-sha256',
    name: 'Text → SHA-256',
    description: 'Hash text input with SHA-256',
    nodes: [{ transformId: 'hash-sha256', options: {} }],
    sampleInput: 'Hello, World!',
  },
];
