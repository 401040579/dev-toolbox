interface DiffLine {
  type: 'equal' | 'added' | 'removed';
  text: string;
  lineNum: { left?: number; right?: number };
}

function computeDiff(a: string, b: string): DiffLine[] {
  const linesA = a.split('\n');
  const linesB = b.split('\n');
  const result: DiffLine[] = [];

  const m = linesA.length;
  const n = linesB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  let i = m, j = n;
  const stack: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      stack.push({ type: 'equal', text: linesA[i - 1]!, lineNum: { left: i, right: j } });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      stack.push({ type: 'added', text: linesB[j - 1]!, lineNum: { right: j } });
      j--;
    } else {
      stack.push({ type: 'removed', text: linesA[i - 1]!, lineNum: { left: i } });
      i--;
    }
  }

  stack.reverse().forEach((l) => result.push(l));
  return result;
}

self.onmessage = (e: MessageEvent<{ left: string; right: string }>) => {
  try {
    const { left, right } = e.data;
    const result = computeDiff(left, right);
    self.postMessage({ result });
  } catch (err) {
    self.postMessage({ error: (err as Error).message });
  }
};
