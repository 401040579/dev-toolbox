interface JsonInput {
  input: string;
  indent: string; // '2' | '4' | 'tab'
}

interface JsonResult {
  output: string;
  minifiedSize: number;
  formattedSize: number;
  keys: number;
}

function countKeys(obj: unknown): number {
  if (typeof obj !== 'object' || obj === null) return 0;
  if (Array.isArray(obj)) return obj.reduce((sum: number, item) => sum + countKeys(item), 0);
  return Object.keys(obj).length + Object.values(obj).reduce((sum: number, val) => sum + countKeys(val), 0);
}

self.onmessage = (e: MessageEvent<JsonInput>) => {
  try {
    const { input, indent } = e.data;
    if (!input.trim()) {
      self.postMessage({ result: null });
      return;
    }

    const parsed = JSON.parse(input);
    const indentValue = indent === 'tab' ? '\t' : Number(indent);
    const formatted = JSON.stringify(parsed, null, indentValue);
    const minified = JSON.stringify(parsed);

    const result: JsonResult = {
      output: formatted,
      keys: countKeys(parsed),
      minifiedSize: new Blob([minified]).size,
      formattedSize: new Blob([formatted]).size,
    };

    self.postMessage({ result });
  } catch (err) {
    self.postMessage({ error: (err as Error).message });
  }
};
