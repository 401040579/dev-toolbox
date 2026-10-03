import { filterLogs, LOG_PAGE_SIZE, MAX_LOG_BYTES, parseLogs, type LogWorkerQuery, type LogWorkerResult, type ParsedLogs } from '@/tools/devtools/log-analyzer/parser';

let previousInput: string | null = null;
let parsed: ParsedLogs | null = null;

self.onmessage = (event: MessageEvent<LogWorkerQuery>) => {
  const { id, input, filters, action } = event.data;
  const base: LogWorkerResult = { id, total: 0, matched: 0, lines: 0, unknown: 0, limited: false, requests: [], records: [], page: 1, error: null, action };
  try {
    if (input !== previousInput || parsed === null) {
      if (new TextEncoder().encode(input).byteLength > MAX_LOG_BYTES) {
        self.postMessage({ ...base, error: 'tooLarge' });
        return;
      }
      parsed = parseLogs(input);
      previousInput = input;
    }
    const filtered = filterLogs(parsed.records, filters);
    const pages = Math.max(1, Math.ceil(filtered.records.length / LOG_PAGE_SIZE));
    const page = Math.min(pages, Math.max(1, event.data.page));
    const result: LogWorkerResult = {
      ...base,
      total: parsed.records.length,
      matched: filtered.records.length,
      lines: parsed.lines,
      unknown: parsed.unknown,
      limited: parsed.limited,
      requests: parsed.requests,
      records: action ? [] : filtered.records.slice((page - 1) * LOG_PAGE_SIZE, page * LOG_PAGE_SIZE),
      page,
      error: filtered.error,
    };
    if (action && !filtered.error) result.text = filtered.records.map((record) => record.raw).join('');
    self.postMessage(result);
  } catch {
    self.postMessage({ ...base, error: 'parseFailed' });
  }
};
