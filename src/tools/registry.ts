import type { ToolDefinition, TransformDefinition, ToolCategory } from './types';

// Import tool definitions directly — no circular dependency since
// tool files no longer import from this module.
import base64Tool from './encoding/base64';
import urlEncodeTool from './encoding/url-encode';
import jwtDecodeTool from './encoding/jwt-decode';
import htmlEntityTool from './encoding/html-entity';
import unicodeEscapeTool from './encoding/unicode-escape';
import hexStringTool from './encoding/hex-string';
import numberBaseTool from './encoding/number-base';
import asciiTableTool from './encoding/ascii-table';
import punycodeTool from './encoding/punycode';
import caesarCipherTool from './encoding/caesar-cipher';
import epochTool from './time/epoch-converter';
import cronParserTool from './time/cron-parser';
import jsonFormatterTool from './json/json-formatter';
import jsonYamlTool from './json/json-yaml';
import sqlFormatterTool from './json/sql-formatter';
import htmlFormatterTool from './json/html-formatter';
import cssFormatterTool from './json/css-formatter';
import jsFormatterTool from './json/js-formatter';
import xmlFormatterTool from './json/xml-formatter';
import tomlConverterTool from './json/toml-converter';
import csvJsonTool from './json/csv-json';
import uuidTool from './generators/uuid';
import hashTool from './generators/hash';
import passwordTool from './generators/password';
import qrcodeTool from './generators/qrcode';
import hmacTool from './crypto/hmac';
import md5Tool from './crypto/md5';
import checksumTool from './crypto/checksum';
import tokenGeneratorTool from './crypto/token-generator';
import aesTool from './crypto/aes';
import rsaKeygenTool from './crypto/rsa-keygen';
import hashFileTool from './crypto/hash-file';
import bcryptTool from './crypto/bcrypt';
import regexTesterTool from './text/regex-tester';
import caseConverterTool from './text/case-converter';
import diffViewerTool from './text/diff-viewer';
import lineToolsTool from './text/line-tools';
import textStatsTool from './text/text-stats';
import loremIpsumTool from './text/lorem-ipsum';
import stringEscapeTool from './text/string-escape';
import slugifyTool from './text/slugify';
import natoPhoneticTool from './text/nato-phonetic';
import truncateTool from './text/truncate';
import markdownPreviewTool from './text/markdown-preview';
import urlParserTool from './network/url-parser';
import queryStringTool from './network/query-string';
import ipConverterTool from './network/ip-converter';
import cidrTool from './network/cidr';
import userAgentTool from './network/user-agent';
import httpHeadersTool from './network/http-headers';
import dataUrlTool from './network/data-url';

const ALL_TOOLS: ToolDefinition[] = [
  base64Tool,
  urlEncodeTool,
  jwtDecodeTool,
  htmlEntityTool,
  unicodeEscapeTool,
  hexStringTool,
  numberBaseTool,
  asciiTableTool,
  punycodeTool,
  caesarCipherTool,
  epochTool,
  cronParserTool,
  jsonFormatterTool,
  jsonYamlTool,
  sqlFormatterTool,
  htmlFormatterTool,
  cssFormatterTool,
  jsFormatterTool,
  xmlFormatterTool,
  tomlConverterTool,
  csvJsonTool,
  uuidTool,
  hashTool,
  passwordTool,
  qrcodeTool,
  hmacTool,
  md5Tool,
  checksumTool,
  tokenGeneratorTool,
  aesTool,
  rsaKeygenTool,
  hashFileTool,
  bcryptTool,
  regexTesterTool,
  caseConverterTool,
  diffViewerTool,
  lineToolsTool,
  textStatsTool,
  loremIpsumTool,
  stringEscapeTool,
  slugifyTool,
  natoPhoneticTool,
  truncateTool,
  markdownPreviewTool,
  urlParserTool,
  queryStringTool,
  ipConverterTool,
  cidrTool,
  userAgentTool,
  httpHeadersTool,
  dataUrlTool,
];

const toolRegistry = new Map<string, ToolDefinition>();
const transformRegistry = new Map<string, TransformDefinition>();

for (const tool of ALL_TOOLS) {
  toolRegistry.set(tool.id, tool);
  if (tool.transforms) {
    for (const t of tool.transforms) {
      transformRegistry.set(t.id, t);
    }
  }
}

export function getTool(id: string): ToolDefinition | undefined {
  return toolRegistry.get(id);
}

export function getToolList(): ToolDefinition[] {
  return Array.from(toolRegistry.values());
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return getToolList().filter((t) => t.category === category);
}

export function getTransform(id: string): TransformDefinition | undefined {
  return transformRegistry.get(id);
}

export function getAllTransforms(): TransformDefinition[] {
  return Array.from(transformRegistry.values());
}

export function searchTools(query: string): ToolDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return getToolList();
  return getToolList().filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.toLowerCase().includes(q)),
  );
}
