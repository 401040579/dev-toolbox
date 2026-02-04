interface RegexInput {
  pattern: string;
  flags: string;
  testString: string;
}

interface MatchResult {
  full: string;
  index: number;
  groups: string[];
}

self.onmessage = (e: MessageEvent<RegexInput>) => {
  try {
    const { pattern, flags, testString } = e.data;
    if (!pattern || !testString) {
      self.postMessage({ result: { matches: [], error: null } });
      return;
    }

    const regex = new RegExp(pattern, flags);
    const matches: MatchResult[] = [];

    if (flags.includes('g')) {
      let m: RegExpExecArray | null;
      let safety = 0;
      while ((m = regex.exec(testString)) !== null && safety++ < 10000) {
        matches.push({
          full: m[0],
          index: m.index,
          groups: m.slice(1),
        });
        if (m[0].length === 0) regex.lastIndex++;
      }
    } else {
      const m = regex.exec(testString);
      if (m) {
        matches.push({
          full: m[0],
          index: m.index,
          groups: m.slice(1),
        });
      }
    }

    self.postMessage({ result: { matches, error: null } });
  } catch (err) {
    self.postMessage({ result: { matches: [], error: (err as Error).message } });
  }
};
