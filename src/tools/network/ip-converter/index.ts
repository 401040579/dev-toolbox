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
  if (parts.length !== 4) return null;

  const octets = parts.map((p) => parseInt(p, 10));
  if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return null;

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
  const num = parseInt(decimal, 10);
  if (isNaN(num) || num < 0 || num > 0xffffffff) return null;

  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join('.');
}

export function parseIPv6(ip: string): IPv6Info | null {
  try {
    // Expand :: notation
    let expanded = ip;
    if (ip.includes('::')) {
      const parts = ip.split('::');
      const left = parts[0] ? parts[0].split(':') : [];
      const right = parts[1] ? parts[1].split(':') : [];
      const missing = 8 - left.length - right.length;
      const middle = new Array(missing).fill('0000');
      expanded = [...left, ...middle, ...right].join(':');
    }

    const groups = expanded.split(':');
    if (groups.length !== 8) return null;

    const normalized = groups.map((g) => g.padStart(4, '0').toUpperCase());
    const full = normalized.join(':');

    // Compress
    let compressed = full
      .replace(/\b0000:/g, '0:')
      .replace(/:0000\b/g, ':0')
      .replace(/(:0)+/, '::')
      .replace(/^0::/, '::')
      .replace(/::0$/, '::');

    const binary = normalized
      .map((g) => parseInt(g, 16).toString(2).padStart(16, '0'))
      .join(':');

    const isLoopback = full === '0000:0000:0000:0000:0000:0000:0000:0001';
    const isLinkLocal = full.startsWith('FE80:');

    let type = 'Global Unicast';
    if (isLoopback) type = 'Loopback';
    else if (isLinkLocal) type = 'Link-Local';
    else if (full.startsWith('FC') || full.startsWith('FD')) type = 'Unique Local';
    else if (full.startsWith('FF')) type = 'Multicast';

    return {
      full,
      compressed,
      binary,
      type,
      isLoopback,
      isLinkLocal,
    };
  } catch {
    return null;
  }
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
