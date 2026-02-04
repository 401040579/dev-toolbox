interface HashInput {
  input: string;
  algorithms: string[];
}

async function computeHash(input: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

self.onmessage = async (e: MessageEvent<HashInput>) => {
  try {
    const { input, algorithms } = e.data;
    if (!input) {
      self.postMessage({ result: {} });
      return;
    }

    const entries = await Promise.all(
      algorithms.map(async (algo) => [algo, await computeHash(input, algo)] as const),
    );

    const result: Record<string, string> = {};
    for (const [algo, hash] of entries) {
      result[algo] = hash;
    }

    self.postMessage({ result });
  } catch (err) {
    self.postMessage({ error: (err as Error).message });
  }
};
