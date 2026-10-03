import type { ToolDefinition } from '@/tools/types';

export interface IPv4Info {
  decimal: string;
  binary: string;
  hex: string;
  octal: string;
  class: string;
  type: string;
  isPrivate: boolean;
  isLoopback: boolean;
  isMulticast: boolean;
}

export interface IPv6Info {
  full: string;
  compressed: string;
  binary: string;
  type: string;
  isLoopback: boolean;
  isLinkLocal: boolean;
}

export function parseIPv4(ip: string): IPv4Info | null {
  const parts = ip.split('.');
  if (parts.length !== 4 || parts.some((part) =>
    part.length < 1 || part.length > 3 || /[^0-9]/.test(part)
  )) return null;

  const octets = parts.map(Number);
  if (octets.some((octet) => octet > 255)) return null;

  const decimal = ((octets[0]! << 24) + (octets[1]! << 16) + (octets[2]! << 8) + octets[3]!) >>> 0;

  const binary = octets.map((o) => o.toString(2).padStart(8, '0')).join('.');
  const hex = octets.map((o) => o.toString(16).padStart(2, '0').toUpperCase()).join('.');
  const octal = octets.map((o) => o.toString(8)).join('.');

  let ipClass = 'Unknown';
  if (octets[0]! < 128) ipClass = 'A';
  else if (octets[0]! < 192) ipClass = 'B';
  else if (octets[0]! < 224) ipClass = 'C';
  else if (octets[0]! < 240) ipClass = 'D (Multicast)';
  else ipClass = 'E (Reserved)';

  const isPrivate =
    octets[0] === 10 ||
    (octets[0] === 172 && octets[1]! >= 16 && octets[1]! <= 31) ||
    (octets[0] === 192 && octets[1] === 168);

  const isLoopback = octets[0] === 127;
  const isMulticast = octets[0]! >= 224 && octets[0]! <= 239;

  let type = 'Public';
  if (isPrivate) type = 'Private';
  else if (isLoopback) type = 'Loopback';
  else if (isMulticast) type = 'Multicast';

  return {
    decimal: decimal.toString(),
    binary,
    hex,
    octal,
    class: ipClass,
    type,
    isPrivate,
    isLoopback,
    isMulticast,
  };
}

export function decimalToIPv4(decimal: string): string | null {
  if (!decimal || /[^0-9]/.test(decimal)) return null;
  const num = Number(decimal);
  if (!Number.isSafeInteger(num) || num > 0xffffffff) return null;

  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join('.');
}

export function parseIPv6(ip: string): IPv6Info | null {
  // Only the existing hexadecimal-group notation is supported, without
  // dotted IPv4 tails, zone identifiers, brackets, or prefix lengths.
  if (!ip || ip.length > 39 || /[^0-9a-f:]/i.test(ip)) return null;

  const compressionIndex = ip.indexOf('::');
  if (compressionIndex !== ip.lastIndexOf('::')) return null;

  const validGroup = (group: string) => group.length >= 1 && group.length <= 4 && !/[^0-9a-f]/i.test(group);
  let groups: string[];
  if (compressionIndex === -1) {
    groups = ip.split(':');
    if (groups.length !== 8 || !groups.every(validGroup)) return null;
  } else {
    const leftPart = ip.slice(0, compressionIndex);
    const rightPart = ip.slice(compressionIndex + 2);
    const left = leftPart ? leftPart.split(':') : [];
    const right = rightPart ? rightPart.split(':') : [];
    const missing = 8 - left.length - right.length;
    // RFC 4291: a single :: must stand for at least one zero group.
    if (missing < 1 || !left.every(validGroup) || !right.every(validGroup)) return null;
    groups = [...left, ...Array<string>(missing).fill('0'), ...right];
  }

  const values = groups.map((group) => parseInt(group, 16));
  const full = values.map((value) => value.toString(16).padStart(4, '0').toUpperCase()).join(':');
  const shortened = values.map((value) => value.toString(16));

  // RFC 5952: compress the longest run of at least two zeros; keep the first
  // run on a tie. Nonzero groups and single zeros have no leading padding.
  let bestStart = -1;
  let bestLength = 1;
  for (let start = 0; start < values.length;) {
    if (values[start] !== 0) {
      start += 1;
      continue;
    }
    let end = start + 1;
    while (end < values.length && values[end] === 0) end += 1;
    if (end - start > bestLength) {
      bestStart = start;
      bestLength = end - start;
    }
    start = end;
  }
  const compressed = bestStart === -1
    ? shortened.join(':')
    : `${shortened.slice(0, bestStart).join(':')}::${shortened.slice(bestStart + bestLength).join(':')}`;
  const binary = values.map((value) => value.toString(2).padStart(16, '0')).join(':');

  const isUnspecified = values.every((value) => value === 0);
  const isLoopback = values.slice(0, 7).every((value) => value === 0) && values[7] === 1;
  const firstGroup = values[0]!;
  const isLinkLocal = (firstGroup & 0xffc0) === 0xfe80;

  let type = 'Global Unicast';
  if (isUnspecified) type = 'Unspecified';
  else if (isLoopback) type = 'Loopback';
  else if (isLinkLocal) type = 'Link-Local';
  else if ((firstGroup & 0xfe00) === 0xfc00) type = 'Unique Local';
  else if ((firstGroup & 0xff00) === 0xff00) type = 'Multicast';

  return { full, compressed, binary, type, isLoopback, isLinkLocal };
}

const tool: ToolDefinition = {
  id: 'ip-converter',
  name: 'IP Address Converter',
  description: 'Convert and analyze IPv4/IPv6 addresses',
  category: 'network',
  keywords: ['ip', 'ipv4', 'ipv6', 'address', 'convert', 'binary', 'decimal', 'network'],
  icon: 'Network',
  component: () => import('./IpConverter'),
};

export default tool;
