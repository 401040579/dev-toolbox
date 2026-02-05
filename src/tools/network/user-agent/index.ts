import type { ToolDefinition } from '@/tools/types';

export interface UAInfo {
  browser: { name: string; version: string } | null;
  os: { name: string; version: string } | null;
  device: { type: string; vendor?: string; model?: string } | null;
  engine: { name: string; version: string } | null;
  cpu: { architecture: string } | null;
}

export function parseUserAgent(ua: string): UAInfo {
  const result: UAInfo = {
    browser: null,
    os: null,
    device: null,
    engine: null,
    cpu: null,
  };

  // Browser detection
  const browserPatterns = [
    { name: 'Chrome', regex: /Chrome\/(\d+[\d.]*)/i },
    { name: 'Firefox', regex: /Firefox\/(\d+[\d.]*)/i },
    { name: 'Safari', regex: /Version\/(\d+[\d.]*).+Safari/i },
    { name: 'Edge', regex: /Edg\/(\d+[\d.]*)/i },
    { name: 'Opera', regex: /OPR\/(\d+[\d.]*)/i },
    { name: 'IE', regex: /MSIE (\d+[\d.]*)|Trident.+rv:(\d+[\d.]*)/i },
  ];

  for (const { name, regex } of browserPatterns) {
    const match = ua.match(regex);
    if (match) {
      result.browser = { name, version: match[1] || match[2] || '' };
      break;
    }
  }

  // OS detection
  const osPatterns = [
    { name: 'Windows', regex: /Windows NT (\d+[\d.]*)/i, versionMap: { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' } },
    { name: 'macOS', regex: /Mac OS X (\d+[._\d]*)/i },
    { name: 'iOS', regex: /iPhone OS (\d+[._\d]*)|iPad.*OS (\d+[._\d]*)/i },
    { name: 'Android', regex: /Android (\d+[\d.]*)/i },
    { name: 'Linux', regex: /Linux/i },
    { name: 'Ubuntu', regex: /Ubuntu/i },
    { name: 'Chrome OS', regex: /CrOS/i },
  ];

  for (const { name, regex, versionMap } of osPatterns) {
    const match = ua.match(regex);
    if (match) {
      let version = (match[1] || match[2] || '').replace(/_/g, '.');
      if (versionMap && version in versionMap) {
        version = (versionMap as Record<string, string>)[version]!;
      }
      result.os = { name, version };
      break;
    }
  }

  // Device type detection
  if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(ua)) {
    result.device = { type: 'Mobile' };
  } else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
    result.device = { type: 'Tablet' };
  } else if (/Smart-?TV|GoogleTV|AppleTV|BRAVIA|NetCast|Roku/i.test(ua)) {
    result.device = { type: 'Smart TV' };
  } else if (/PlayStation|Xbox|Nintendo/i.test(ua)) {
    result.device = { type: 'Game Console' };
  } else {
    result.device = { type: 'Desktop' };
  }

  // Engine detection
  const enginePatterns = [
    { name: 'Blink', regex: /Chrome\/(\d+)/i },
    { name: 'Gecko', regex: /Gecko\/(\d+)/i },
    { name: 'WebKit', regex: /AppleWebKit\/(\d+[\d.]*)/i },
    { name: 'Trident', regex: /Trident\/(\d+[\d.]*)/i },
  ];

  for (const { name, regex } of enginePatterns) {
    const match = ua.match(regex);
    if (match) {
      result.engine = { name, version: match[1] || '' };
      break;
    }
  }

  // CPU architecture
  if (/arm64|aarch64/i.test(ua)) {
    result.cpu = { architecture: 'ARM64' };
  } else if (/arm/i.test(ua)) {
    result.cpu = { architecture: 'ARM' };
  } else if (/x86_64|x64|amd64|win64/i.test(ua)) {
    result.cpu = { architecture: 'x64' };
  } else if (/x86|i686|i386/i.test(ua)) {
    result.cpu = { architecture: 'x86' };
  }

  return result;
}

const tool: ToolDefinition = {
  id: 'user-agent',
  name: 'User Agent Parser',
  description: 'Parse user agent strings to detect browser, OS, and device',
  category: 'network',
  keywords: ['user', 'agent', 'ua', 'browser', 'os', 'device', 'parse'],
  icon: 'Smartphone',
  component: () => import('./UserAgent'),
};

export default tool;
