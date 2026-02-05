import type { ToolDefinition } from '@/tools/types';

type SqlDialect = 'standard' | 'mysql' | 'postgresql' | 'sqlite';

// Keywords for different SQL dialects
const SQL_KEYWORDS = {
  standard: [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE',
    'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN',
    'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN', 'ON',
    'AS', 'DISTINCT', 'ALL', 'UNION', 'INTERSECT', 'EXCEPT', 'INSERT INTO',
    'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE',
    'DROP TABLE', 'CREATE INDEX', 'DROP INDEX', 'PRIMARY KEY', 'FOREIGN KEY',
    'REFERENCES', 'CONSTRAINT', 'DEFAULT', 'NULL', 'NOT NULL', 'UNIQUE',
    'CHECK', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'CAST', 'COALESCE',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ASC', 'DESC', 'EXISTS', 'IS',
    'TRUE', 'FALSE', 'WITH', 'RECURSIVE', 'OVER', 'PARTITION BY', 'ROW_NUMBER',
    'RANK', 'DENSE_RANK', 'WINDOW', 'ROWS', 'RANGE', 'UNBOUNDED', 'PRECEDING',
    'FOLLOWING', 'CURRENT ROW',
  ],
  mysql: ['AUTO_INCREMENT', 'ENGINE', 'CHARSET', 'COLLATE', 'SHOW', 'DESCRIBE', 'USE', 'DATABASE'],
  postgresql: ['SERIAL', 'BIGSERIAL', 'RETURNING', 'ILIKE', 'ARRAY', 'JSONB', 'JSON'],
  sqlite: ['AUTOINCREMENT', 'GLOB', 'PRAGMA', 'VACUUM', 'ATTACH', 'DETACH'],
};

// Major keywords that should start on a new line
const NEWLINE_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING',
  'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
  'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN', 'UNION', 'INTERSECT', 'EXCEPT',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
  'ALTER TABLE', 'DROP TABLE', 'WITH', 'RETURNING',
];

export interface FormatOptions {
  indent: string;
  uppercase: boolean;
  dialect: SqlDialect;
}

export function formatSQL(
  sql: string,
  options: Partial<FormatOptions> = {}
): string {
  const { indent = '  ', uppercase = true, dialect = 'standard' } = options;

  if (!sql.trim()) return '';

  // Get all keywords for this dialect
  const allKeywords = [...SQL_KEYWORDS.standard];
  if (dialect !== 'standard' && SQL_KEYWORDS[dialect]) {
    allKeywords.push(...SQL_KEYWORDS[dialect]);
  }

  // Tokenize the SQL
  const tokens = tokenize(sql);

  // Format the tokens
  let result = '';
  let indentLevel = 0;
  let prevToken = '';
  let isFirstToken = true;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const nextToken = tokens[i + 1] || '';

    // Handle keywords
    const upperToken = token.toUpperCase();
    const isKeyword = allKeywords.includes(upperToken);

    // Check for compound keywords (e.g., "ORDER BY")
    const compoundKeyword = upperToken + ' ' + (nextToken?.toUpperCase() || '');
    const isCompound = allKeywords.includes(compoundKeyword);

    let formattedToken = isKeyword && uppercase ? upperToken : token;

    // Handle parentheses
    if (token === '(') {
      result += '(';
      indentLevel++;
      continue;
    }

    if (token === ')') {
      indentLevel = Math.max(0, indentLevel - 1);
      result += ')';
      continue;
    }

    // Add newline before major keywords
    const shouldNewline = NEWLINE_KEYWORDS.includes(upperToken) ||
      (isCompound && NEWLINE_KEYWORDS.includes(compoundKeyword));

    if (shouldNewline && !isFirstToken) {
      result = result.trimEnd();
      result += '\n' + indent.repeat(indentLevel);
    } else if (!isFirstToken && prevToken !== '(' && token !== ')' && token !== ',' && prevToken !== ',') {
      result += ' ';
    }

    // Handle commas
    if (token === ',') {
      result += ',\n' + indent.repeat(indentLevel + 1);
      prevToken = token;
      continue;
    }

    result += formattedToken;
    prevToken = token;
    isFirstToken = false;
  }

  return result.trim();
}

function tokenize(sql: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let i = 0;

  while (i < sql.length) {
    const char = sql[i]!;
    const nextChar = sql[i + 1] || '';

    // Handle string literals
    if ((char === "'" || char === '"') && !inString) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      inString = true;
      stringChar = char;
      current += char;
      i++;
      continue;
    }

    if (inString) {
      current += char;
      if (char === stringChar && nextChar !== stringChar) {
        tokens.push(current);
        current = '';
        inString = false;
      } else if (char === stringChar && nextChar === stringChar) {
        current += nextChar;
        i++;
      }
      i++;
      continue;
    }

    // Handle comments
    if (char === '-' && nextChar === '-') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      let comment = '';
      while (i < sql.length && sql[i] !== '\n') {
        comment += sql[i];
        i++;
      }
      tokens.push(comment);
      continue;
    }

    // Handle special characters
    if ('(),;'.includes(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      if (char !== ';') {
        tokens.push(char);
      }
      i++;
      continue;
    }

    // Handle whitespace
    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      i++;
      continue;
    }

    current += char;
    i++;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

export function minifySQL(sql: string): string {
  if (!sql.trim()) return '';

  const tokens = tokenize(sql);
  let result = '';
  let prevToken = '';

  for (const token of tokens) {
    // Skip adding space for certain cases
    if (token === ',' || token === '(' || token === ')') {
      result += token;
    } else if (prevToken === '(' || prevToken === ',') {
      result += token;
    } else if (result && prevToken !== ')' || (prevToken === ')' && ![')', ','].includes(token))) {
      result += ' ' + token;
    } else {
      result += token;
    }
    prevToken = token;
  }

  return result.trim();
}

const tool: ToolDefinition = {
  id: 'sql-formatter',
  name: 'SQL Formatter',
  description: 'Format and beautify SQL queries',
  category: 'json',
  keywords: ['sql', 'format', 'beautify', 'query', 'database', 'mysql', 'postgresql'],
  icon: 'Database',
  component: () => import('./SqlFormatter'),
};

export default tool;
