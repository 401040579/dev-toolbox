import { describe, expect, it } from 'vitest';
import { EMPTY_LOG_FILTERS, filterLogs, MAX_LOG_RECORDS, parseLogs } from './parser';

describe('log parsing', () => {
  it('retains every original line and keeps stack traces on their header', () => {
    const input = '2026-10-02T08:00:00Z ERROR requestId=r-1 Failed\r\n    Error: Failed\r\n        at error.handle (app.ts:1:2)\r\nCaused by: Timeout\r\n\r\n{broken JSON\r\nA plain line\r\n';
    const parsed = parseLogs(input);
    expect(parsed.records).toHaveLength(3);
    expect(parsed.records[0]).toMatchObject({ line: 1, endLine: 5, requestId: 'r-1', level: 'ERROR' });
    expect(parsed.records.map((record) => record.raw).join('')).toBe(input);
    expect(parsed.unknown).toBe(2);
    expect(parsed.lines).toBe(7);
  });

  it('recognizes JSONL timestamps, Pino severity and nested request identifiers', () => {
    const parsed = parseLogs([
      '{"time":1790928000000,"level":30,"req":{"id":"r-2"},"msg":"started"}',
      '{"timestamp":"2026-10-02T08:00:01Z","severity":"warning","context":{"request_id":"r-2"}}',
      '{"@timestamp":"2026-10-02T08:00:02Z","level":"CRITICAL","traceId":"r-3"}',
    ].join('\n'));
    expect(parsed.records.map((record) => record.level)).toEqual(['INFO', 'WARN', 'FATAL']);
    expect(parsed.records.map((record) => record.requestId)).toEqual(['r-2', 'r-2', 'r-3']);
    expect(parsed.records.every((record) => record.timestamp !== null)).toBe(true);
    expect(parsed.requests).toEqual([{ id: 'r-2', count: 2 }, { id: 'r-3', count: 1 }]);
  });

  it('keeps malformed JSON and timestamp-free text readable', () => {
    const parsed = parseLogs('{"broken":\nAn ordinary message\n{"message":"valid, no timestamp"}');
    expect(parsed.records.map((record) => record.recognized)).toEqual([false, false, true]);
    expect(parsed.records[2]).toMatchObject({ timestamp: null, level: 'UNKNOWN' });
  });

  it('does not normalize impossible calendar dates into another day', () => {
    const parsed = parseLogs('2026-02-30T08:00:00Z ERROR requestId=r-1 Invalid date\n2026-02-28T08:00:00Z INFO requestId=r-1 Valid date');
    expect(parsed.records[0]?.timestamp).toBeNull();
    expect(parsed.records[1]?.timestamp).toBe(Date.parse('2026-02-28T08:00:00Z'));
  });

  it('keeps a new exception request separate from the preceding request and its stack', () => {
    const input = 'INFO requestId=req-1 Previous request completed\nError: requestId=req-2 Payment failed\n    at processPayment (payment.ts:42:9)\n';
    const parsed = parseLogs(input);
    expect(parsed.records).toHaveLength(2);
    expect(parsed.records[0]).toMatchObject({ line: 1, endLine: 1, level: 'INFO', requestId: 'req-1' });
    expect(parsed.records[1]).toMatchObject({ line: 2, endLine: 3, level: 'ERROR', requestId: 'req-2' });
    expect(filterLogs(parsed.records, { ...EMPTY_LOG_FILTERS, requestId: 'req-2' }).records.map((record) => record.raw))
      .toEqual(['Error: requestId=req-2 Payment failed\n    at processPayment (payment.ts:42:9)\n']);
    expect(parsed.records.map((record) => record.raw).join('')).toBe(input);
  });

  it('does not mistake a request ID word for the explicit severity', () => {
    const input = '2026-10-02T08:00:00Z requestId=INFO-request ERROR Payment failed\n';
    const parsed = parseLogs(input);
    expect(parsed.records[0]).toMatchObject({ level: 'ERROR', requestId: 'INFO-request', raw: input });
    expect(filterLogs(parsed.records, { ...EMPTY_LOG_FILTERS, level: 'ERROR' }).records).toHaveLength(1);
    expect(filterLogs(parsed.records, { ...EMPTY_LOG_FILTERS, level: 'INFO' }).records).toHaveLength(0);
  });

  it('validates the matched timestamp calendar before parsing padded JSON dates', () => {
    const input = [
      '{"timestamp":" 2026-02-30 08:00:00Z","level":"ERROR","requestId":"req-2"}',
      '{"timestamp":" 2026-02-28 08:00:00Z ","level":"INFO","requestId":"req-2"}',
    ].join('\n');
    const parsed = parseLogs(input);
    expect(parsed.records[0]?.timestamp).toBeNull();
    expect(parsed.records[1]?.timestamp).toBe(Date.parse('2026-02-28T08:00:00Z'));
    expect(filterLogs(parsed.records, { ...EMPTY_LOG_FILTERS, from: '2026-03-01T00:00:00Z' }).records).toHaveLength(0);
    expect(parsed.records.map((record) => record.raw).join('')).toBe(input);
  });

  it.each([
    ['INFO requestId=ERROR-request Started', 'INFO'],
    ['[WARN] request_id=INFO-request Retrying', 'WARN'],
    ['2026-10-02T08:00:00Z ERROR requestId=DEBUG.request Failed', 'ERROR'],
    ['requestId="WARN-request" [DEBUG] Details', 'DEBUG'],
    ['trace_id=FATAL-trace requestId=ERROR-request INFO Started', 'INFO'],
    ['requestId=ERROR-request trace_id=INFO-trace Started', 'UNKNOWN'],
    ['[CRITICAL] correlationId=NOTICE-request Failed', 'FATAL'],
  ])('keeps ordinary severity prefixes and removes ID-value contamination in %s', (input, level) => {
    expect(parseLogs(input).records[0]?.level).toBe(level);
  });

  it('retains a normal unprefixed exception stack while starting timestamped or explicitly identified records', () => {
    const input = [
      '2026-10-02T08:00:00Z ERROR requestId=r-1 Failed',
      'Error: Upstream timeout',
      '    at processPayment (payment.ts:42:9)',
      'Caused by: java.lang.IllegalStateException: Closed',
      '    ... 3 more',
      'Error: requestId=r-1 Retrying failed',
      '    at retry (payment.ts:80:9)',
      'Error: 2026-10-02T08:00:01Z Another failure',
      'Error: 2026-02-30T08:00:01Z Invalid calendar date',
    ].join('\n');
    const parsed = parseLogs(input);
    expect(parsed.records).toHaveLength(4);
    expect(parsed.records.map((record) => [record.line, record.endLine])).toEqual([[1, 5], [6, 7], [8, 8], [9, 9]]);
    expect(parsed.records[0]).toMatchObject({ level: 'ERROR', requestId: 'r-1' });
    expect(parsed.records[1]).toMatchObject({ level: 'ERROR', requestId: 'r-1' });
    expect(parsed.records[2]?.timestamp).toBe(Date.parse('2026-10-02T08:00:01Z'));
    expect(parsed.records[3]?.timestamp).toBeNull();
    expect(parsed.records.map((record) => record.raw).join('')).toBe(input);
  });

  it('preserves the complete remainder when the indexing limit is reached', () => {
    const input = 'unrecognized\n'.repeat(MAX_LOG_RECORDS + 3);
    const parsed = parseLogs(input);
    expect(parsed.limited).toBe(true);
    expect(parsed.records).toHaveLength(MAX_LOG_RECORDS + 1);
    expect(parsed.records[parsed.records.length - 1]).toMatchObject({ line: MAX_LOG_RECORDS + 1, endLine: MAX_LOG_RECORDS + 3 });
    expect(parsed.lines).toBe(MAX_LOG_RECORDS + 3);
    expect(parsed.records.map((record) => record.raw).join('')).toBe(input);
  });
});

describe('log filters', () => {
  const input = '2026-10-02T08:00:00Z INFO request_id=req-1 Begin\n2026-10-02T08:00:01Z ERROR requestId=req-1 Payment failed\n    at processPayment (payment.ts:42:9)\n2026-10-02T08:00:02Z WARN requestId=req-10 Retry\nNo timestamp here';
  const records = parseLogs(input).records;

  it('matches exact IDs rather than prefixes and finds keywords in stack traces', () => {
    expect(filterLogs(records, { ...EMPTY_LOG_FILTERS, requestId: 'req-1' }).records).toHaveLength(2);
    expect(filterLogs(records, { ...EMPTY_LOG_FILTERS, keyword: 'PROCESSPAYMENT' }).records).toHaveLength(1);
    expect(filterLogs(records, { ...EMPTY_LOG_FILTERS, level: 'ERROR', requestId: 'req-1' }).records).toHaveLength(1);
  });

  it('uses inclusive time ranges and excludes entries without timestamps', () => {
    const result = filterLogs(records, { ...EMPTY_LOG_FILTERS, from: '2026-10-02T08:00:00Z', to: '2026-10-02T08:00:01Z' });
    expect(result.records).toHaveLength(2);
    expect(result.error).toBeNull();
    expect(filterLogs(records, { ...EMPTY_LOG_FILTERS, level: 'UNKNOWN' }).records).toHaveLength(1);
  });

  it('reports invalid and reversed time ranges instead of silently empty results', () => {
    expect(filterLogs(records, { ...EMPTY_LOG_FILTERS, from: 'invalid' })).toEqual({ records: [], error: 'invalidTimeRange' });
    expect(filterLogs(records, { ...EMPTY_LOG_FILTERS, from: '2026-10-03', to: '2026-10-02' }).error).toBe('invalidTimeRange');
  });
});
