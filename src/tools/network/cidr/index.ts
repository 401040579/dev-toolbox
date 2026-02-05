import type { ToolDefinition } from '@/tools/types';

export interface CIDRInfo {
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  netmask: string;
  wildcardMask: string;
  totalHosts: number;
  usableHosts: number;
  binaryNetmask: string;
  ipClass: string;
}

export function parseCIDR(cidr: string): CIDRInfo | null {
  const match = cidr.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!match) return null;

  const [, ipStr, prefixStr] = match;
  const prefix = parseInt(prefixStr!, 10);
  if (prefix < 0 || prefix > 32) return null;

  const ipParts = ipStr!.split('.').map(Number);
  if (ipParts.some((p) => p < 0 || p > 255)) return null;

  const ip = ((ipParts[0]! << 24) + (ipParts[1]! << 16) + (ipParts[2]! << 8) + ipParts[3]!) >>> 0;

  // Calculate netmask
  const netmask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcardMask = ~netmask >>> 0;

  // Calculate network and broadcast
  const network = (ip & netmask) >>> 0;
  const broadcast = (network | wildcardMask) >>> 0;

  // Calculate first and last host
  const firstHost = prefix >= 31 ? network : (network + 1) >>> 0;
  const lastHost = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;

  // Calculate hosts
  const totalHosts = prefix === 32 ? 1 : Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? totalHosts : totalHosts - 2;

  // Convert to string format
  const toIP = (n: number) => [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join('.');

  const toBinary = (n: number) => [
    ((n >>> 24) & 0xff).toString(2).padStart(8, '0'),
    ((n >>> 16) & 0xff).toString(2).padStart(8, '0'),
    ((n >>> 8) & 0xff).toString(2).padStart(8, '0'),
    (n & 0xff).toString(2).padStart(8, '0'),
  ].join('.');

  // Determine class
  let ipClass = 'Unknown';
  if (ipParts[0]! < 128) ipClass = 'A';
  else if (ipParts[0]! < 192) ipClass = 'B';
  else if (ipParts[0]! < 224) ipClass = 'C';
  else if (ipParts[0]! < 240) ipClass = 'D';
  else ipClass = 'E';

  return {
    network: toIP(network),
    broadcast: toIP(broadcast),
    firstHost: toIP(firstHost),
    lastHost: toIP(lastHost),
    netmask: toIP(netmask),
    wildcardMask: toIP(wildcardMask),
    totalHosts,
    usableHosts,
    binaryNetmask: toBinary(netmask),
    ipClass,
  };
}

const tool: ToolDefinition = {
  id: 'cidr',
  name: 'CIDR Calculator',
  description: 'Calculate subnet details from CIDR notation',
  category: 'network',
  keywords: ['cidr', 'subnet', 'netmask', 'network', 'ip', 'calculator'],
  icon: 'Binary',
  component: () => import('./Cidr'),
};

export default tool;
