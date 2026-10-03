export const MAX_LOG_BYTES = 10 * 1024 * 1024;
export const LOG_PAGE_SIZE = 100;
// Tiny lines can otherwise produce millions of objects from a permitted file.
export const MAX_LOG_RECORDS = 100_000;

export const LOG_LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'UNKNOWN'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export interface LogRecord {
  line: number;
  endLine: number;
  raw: string;
  timestamp: number | null;
  level: LogLevel;
  requestId: string | null;
  recognized: boolean;
}

export interface ParsedLogs {
  records: LogRecord[];
  lines: number;
  unknown: number;
  limited: boolean;
  requests: { id: string; count: number }[];
}

export interface LogFilters {
  keyword: string;
  level: string;
  requestId: string;
  from: string;
  to: string;
}

export const EMPTY_LOG_FILTERS: LogFilters = { keyword: '', level: '', requestId: '', from: '', to: '' };

const timestampPattern = /\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?(?:Z|[+-]\d{2}:?\d{2})?\b/i;
const levelPattern = /\b(TRACE|DEBUG|INFO|NOTICE|WARN(?:ING)?|ERROR|ERR|FATAL|CRITICAL)\b/i;
const requestPattern = /\b(?:request[_ -]?id|req[_ -]?id|correlation[_ -]?id|trace[_ -]?id)\s*[:=]\s*["']?([\w.:/-]+)/i;
const requestFieldsPattern = new RegExp(requestPattern.source, 'gi');

function levelFrom(value: unknown): LogLevel {
  if (typeof value === 'number') {
    if (value === 10) return 'TRACE';
    if (value === 20) return 'DEBUG';
    if (value === 30) return 'INFO';
    if (value === 40) return 'WARN';
    if (value === 50) return 'ERROR';
    if (value === 60) return 'FATAL';
    return 'UNKNOWN';
  }
  if (typeof value !== 'string') return 'UNKNOWN';
  const normalized = value.toUpperCase();
  if (normalized === 'WARNING') return 'WARN';
  if (normalized === 'ERR') return 'ERROR';
  if (normalized === 'CRITICAL') return 'FATAL';
  if (normalized === 'NOTICE') return 'INFO';
  return (LOG_LEVELS as readonly string[]).includes(normalized) ? normalized as LogLevel : 'UNKNOWN';
}

function timeFrom(value: unknown): number | null {
  if (typeof value === 'number') {
    const milliseconds = Math.abs(value) < 1e11 ? value * 1000 : value;
    return Number.isFinite(milliseconds) && !Number.isNaN(new Date(milliseconds).getTime()) ? milliseconds : null;
  }
  if (typeof value !== 'string') return null;
  const matched = value.match(timestampPattern)?.[0];
  if (!matched) return null;
  // Validate the same matched date we parse, including when JSON timestamp
  // values have surrounding whitespace. Date.parse can roll Feb 30 into March.
  const calendar = /^(\d{4})-(\d{2})-(\d{2})/.exec(matched);
  if (calendar) {
    const year = Number(calendar[1]);
    const month = Number(calendar[2]);
    const day = Number(calendar[3]);
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  }
  const parsed = Date.parse(matched.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function stringId(value: unknown): string | null {
  return (typeof value === 'string' && value.trim()) || (typeof value === 'number' && Number.isFinite(value))
    ? String(value).trim()
    : null;
}

function metadata(line: string): Pick<LogRecord, 'timestamp' | 'level' | 'requestId' | 'recognized'> {
  const trimmed = line.trim();
  if (trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed) as Record<string, unknown>;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const context = data.context && typeof data.context === 'object' ? data.context as Record<string, unknown> : {};
        const req = data.req && typeof data.req === 'object' ? data.req as Record<string, unknown> : {};
        const timestamp = timeFrom(data.timestamp ?? data.time ?? data['@timestamp'] ?? data.ts ?? data.date);
        const level = levelFrom(data.level ?? data.severity ?? data.severityText ?? data.loglevel ?? data.logLevel);
        const requestId = stringId(data.requestId ?? data.requestID ?? data.request_id ?? data.reqId ?? data.req_id ?? data.correlationId ?? data.correlation_id ?? data.traceId ?? data.trace_id ?? context.requestId ?? context.request_id ?? req.id);
        return { timestamp, level, requestId, recognized: true };
      }
    } catch {
      // Malformed JSON remains visible and exportable as its original text.
      return { timestamp: null, level: 'UNKNOWN', requestId: null, recognized: false };
    }
  }
  const timestamp = timeFrom(line.match(timestampPattern)?.[0]);
  // IDs such as INFO-request are data, even when they appear before the level.
  const level = levelFrom(line.replace(requestFieldsPattern, ' ').match(levelPattern)?.[1]);
  const requestId = line.match(requestPattern)?.[1] ?? null;
  return { timestamp, level, requestId, recognized: timestamp !== null || level !== 'UNKNOWN' || requestId !== null };
}

export function parseLogs(input: string): ParsedLogs {
  const records: LogRecord[] = [];
  const requests = new Map<string, number>();
  let offset = 0;
  let lineNumber = 0;
  let limited = false;
  while (offset < input.length) {
    const newline = input.indexOf('\n', offset);
    const next = newline === -1 ? input.length : newline + 1;
    const raw = input.slice(offset, next);
    lineNumber++;
    if (records.length >= MAX_LOG_RECORDS) {
      // Keep the entire remainder as one unclassified block: no dropped lines.
      const remainder = input.slice(offset);
      const remainingLines = (remainder.match(/\n/g)?.length ?? 0) + (remainder.endsWith('\n') ? 0 : 1);
      lineNumber += remainingLines - 1;
      records.push({ line: lineNumber - remainingLines + 1, endLine: lineNumber, raw: remainder, timestamp: null, level: 'UNKNOWN', requestId: null, recognized: false });
      limited = true;
      break;
    }
    const details = metadata(raw);
    const previous = records[records.length - 1];
    const stackLine = /^\s*(?:at\s|Caused by:|\.{3} \d+ more|(?:[\w.]+)?(?:Error|Exception):)/.test(raw);
    const indentedContinuation = /^\s/.test(raw) && details.timestamp === null && !raw.trimStart().startsWith('{') && !/^\s*\[?(?:TRACE|DEBUG|INFO|NOTICE|WARN(?:ING)?|ERROR|ERR|FATAL|CRITICAL)[\]\s:]/i.test(raw);
    // Explicit timestamp/request metadata starts a record, even when its
    // exception-shaped text resembles a continuation of the previous stack.
    const startsRecord = timestampPattern.test(raw) || details.requestId !== null;
    const continuation = !startsRecord && (!raw.trim() || stackLine || indentedContinuation);
    if (previous && continuation) {
      previous.raw += raw;
      previous.endLine = lineNumber;
    } else {
      const record = { line: lineNumber, endLine: lineNumber, raw, ...details };
      records.push(record);
      if (record.requestId) requests.set(record.requestId, (requests.get(record.requestId) ?? 0) + 1);
    }
    offset = next;
  }
  return {
    records,
    lines: lineNumber,
    unknown: records.filter((record) => !record.recognized).length,
    limited,
    requests: Array.from(requests, ([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id)).slice(0, 40),
  };
}

export function filterLogs(records: LogRecord[], filters: LogFilters): { records: LogRecord[]; error: 'invalidTimeRange' | null } {
  const from = filters.from ? Date.parse(filters.from) : null;
  const to = filters.to ? Date.parse(filters.to) : null;
  if ((from !== null && !Number.isFinite(from)) || (to !== null && !Number.isFinite(to)) || (from !== null && to !== null && from > to)) {
    return { records: [], error: 'invalidTimeRange' };
  }
  const keyword = filters.keyword.toLocaleLowerCase();
  const requestId = filters.requestId.trim();
  return {
    records: records.filter((record) => {
      if (filters.level && record.level !== filters.level) return false;
      if (requestId && record.requestId !== requestId) return false;
      if (keyword && !record.raw.toLocaleLowerCase().includes(keyword)) return false;
      if (from !== null && (record.timestamp === null || record.timestamp < from)) return false;
      if (to !== null && (record.timestamp === null || record.timestamp > to)) return false;
      return true;
    }),
    error: null,
  };
}

export interface LogWorkerQuery {
  id: number;
  input: string;
  filters: LogFilters;
  page: number;
  action?: 'copy' | 'download';
}

export interface LogWorkerResult {
  id: number;
  total: number;
  matched: number;
  lines: number;
  unknown: number;
  limited: boolean;
  requests: ParsedLogs['requests'];
  records: LogRecord[];
  page: number;
  error: 'invalidTimeRange' | 'tooLarge' | 'parseFailed' | null;
  action?: 'copy' | 'download';
  text?: string;
}
