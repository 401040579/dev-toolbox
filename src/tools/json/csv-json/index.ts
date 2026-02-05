import type { ToolDefinition } from '@/tools/types';

export interface CsvParseOptions {
  delimiter: string;
  hasHeader: boolean;
}

export function csvToJson(
  csv: string,
  options: Partial<CsvParseOptions> = {}
): string {
  const { delimiter = ',', hasHeader = true } = options;

  if (!csv.trim()) return '[]';

  const rows = parseCSV(csv, delimiter);
  if (rows.length === 0) return '[]';

  if (hasHeader) {
    const headers = rows[0]!;
    const data = rows.slice(1).map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });
    return JSON.stringify(data, null, 2);
  } else {
    return JSON.stringify(rows, null, 2);
  }
}

export function jsonToCsv(
  json: string,
  options: Partial<CsvParseOptions> = {}
): string {
  const { delimiter = ',' } = options;

  const data = JSON.parse(json);

  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Check if it's an array of objects or array of arrays
  const firstItem = data[0];

  if (Array.isArray(firstItem)) {
    // Array of arrays
    return data
      .map((row: unknown[]) => row.map(cell => escapeCell(String(cell ?? ''), delimiter)).join(delimiter))
      .join('\n');
  }

  if (typeof firstItem === 'object' && firstItem !== null) {
    // Array of objects
    const headers = Object.keys(firstItem);
    const headerRow = headers.map(h => escapeCell(h, delimiter)).join(delimiter);
    const dataRows = data.map((item: Record<string, unknown>) =>
      headers.map(h => escapeCell(String(item[h] ?? ''), delimiter)).join(delimiter)
    );
    return [headerRow, ...dataRows].join('\n');
  }

  // Array of primitives
  return data.map((item: unknown) => escapeCell(String(item ?? ''), delimiter)).join('\n');
}

function parseCSV(csv: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]!;
    const nextChar = csv[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++; // Skip \n after \r
      } else if (char !== '\r') {
        currentCell += char;
      }
    }
  }

  // Handle last cell/row
  currentRow.push(currentCell.trim());
  if (currentRow.some(cell => cell !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

function escapeCell(value: string, delimiter: string): string {
  // If the value contains the delimiter, newlines, or quotes, wrap it in quotes
  if (value.includes(delimiter) || value.includes('\n') || value.includes('\r') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const tool: ToolDefinition = {
  id: 'csv-json',
  name: 'CSV ↔ JSON',
  description: 'Convert between CSV and JSON formats',
  category: 'json',
  keywords: ['csv', 'json', 'convert', 'spreadsheet', 'data', 'table'],
  icon: 'Table',
  component: () => import('./CsvJson'),
};

export default tool;
