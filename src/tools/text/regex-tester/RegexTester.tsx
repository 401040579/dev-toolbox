import { useState, useMemo } from 'react';

interface MatchResult {
  full: string;
  index: number;
  groups: string[];
}

export default function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');

  const result = useMemo((): { matches: MatchResult[]; error: string | null } => {
    if (!pattern || !testString) return { matches: [], error: null };
    try {
      const regex = new RegExp(pattern, flags);
      const matches: MatchResult[] = [];

      if (flags.includes('g')) {
        let m: RegExpExecArray | null;
        let safety = 0;
        while ((m = regex.exec(testString)) !== null && safety++ < 1000) {
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

      return { matches, error: null };
    } catch (e) {
      return { matches: [], error: (e as Error).message };
    }
  }, [pattern, flags, testString]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">Regex Tester</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Test regular expressions with real-time matching
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Pattern */}
        <div className="flex items-center gap-2">
          <span className="text-text-muted font-mono text-lg">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="pattern"
            className="flex-1 font-mono"
            spellCheck={false}
          />
          <span className="text-text-muted font-mono text-lg">/</span>
          <input
            type="text"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            className="w-16 text-center font-mono"
            placeholder="flags"
          />
        </div>

        {/* Flags helper */}
        <div className="flex flex-wrap gap-2">
          {['g', 'i', 'm', 's', 'u'].map((f) => (
            <button
              key={f}
              onClick={() =>
                setFlags((prev) => (prev.includes(f) ? prev.replace(f, '') : prev + f))
              }
              className={`px-2 py-0.5 text-xs font-mono rounded border transition-colors ${
                flags.includes(f)
                  ? 'border-accent text-accent bg-accent-muted'
                  : 'border-border text-text-muted hover:text-text-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {result.error && (
          <p className="text-error text-sm font-mono">{result.error}</p>
        )}

        {/* Test string */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Test String
          </label>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter text to test against..."
            className="w-full min-h-[120px] resize-y"
            spellCheck={false}
          />
        </div>

        {/* Results */}
        {result.matches.length > 0 && (
          <div>
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              {result.matches.length} match{result.matches.length !== 1 ? 'es' : ''}
            </div>
            <div className="space-y-2">
              {result.matches.map((m, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface p-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-text-muted text-xs font-mono">#{i + 1}</span>
                    <code className="font-mono text-accent">{m.full}</code>
                    <span className="text-text-muted text-xs">at index {m.index}</span>
                  </div>
                  {m.groups.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.groups.map((g, gi) => (
                        <span key={gi} className="px-2 py-0.5 rounded bg-surface-hover text-xs font-mono text-text-secondary">
                          ${gi + 1}: {g ?? 'undefined'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {pattern && testString && !result.error && result.matches.length === 0 && (
          <p className="text-text-muted text-sm">No matches found</p>
        )}
      </div>
    </div>
  );
}
