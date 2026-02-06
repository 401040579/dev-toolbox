import type { ToolDefinition } from '@/tools/types';

export interface Permission {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface ChmodState {
  owner: Permission;
  group: Permission;
  others: Permission;
}

export function chmodToOctal(state: ChmodState): string {
  const toDigit = (p: Permission) => (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.execute ? 1 : 0);
  return `${toDigit(state.owner)}${toDigit(state.group)}${toDigit(state.others)}`;
}

export function octalToChmod(octal: string): ChmodState | null {
  if (!/^[0-7]{3}$/.test(octal)) return null;
  const fromDigit = (d: number): Permission => ({
    read: (d & 4) !== 0,
    write: (d & 2) !== 0,
    execute: (d & 1) !== 0,
  });
  return {
    owner: fromDigit(parseInt(octal[0]!)),
    group: fromDigit(parseInt(octal[1]!)),
    others: fromDigit(parseInt(octal[2]!)),
  };
}

export function chmodToSymbolic(state: ChmodState): string {
  const toStr = (p: Permission) =>
    (p.read ? 'r' : '-') + (p.write ? 'w' : '-') + (p.execute ? 'x' : '-');
  return toStr(state.owner) + toStr(state.group) + toStr(state.others);
}

export function symbolicToChmod(symbolic: string): ChmodState | null {
  if (!/^[rwx-]{9}$/.test(symbolic)) return null;
  const fromStr = (s: string): Permission => ({
    read: s[0] === 'r',
    write: s[1] === 'w',
    execute: s[2] === 'x',
  });
  return {
    owner: fromStr(symbolic.slice(0, 3)),
    group: fromStr(symbolic.slice(3, 6)),
    others: fromStr(symbolic.slice(6, 9)),
  };
}

export const COMMON_PERMISSIONS: { octal: string; symbolic: string; description: string }[] = [
  { octal: '777', symbolic: 'rwxrwxrwx', description: 'Full access for all' },
  { octal: '755', symbolic: 'rwxr-xr-x', description: 'Owner full, others read/execute' },
  { octal: '750', symbolic: 'rwxr-x---', description: 'Owner full, group read/execute' },
  { octal: '700', symbolic: 'rwx------', description: 'Owner only' },
  { octal: '644', symbolic: 'rw-r--r--', description: 'Owner read/write, others read' },
  { octal: '600', symbolic: 'rw-------', description: 'Owner read/write only' },
  { octal: '555', symbolic: 'r-xr-xr-x', description: 'Read/execute for all' },
  { octal: '444', symbolic: 'r--r--r--', description: 'Read-only for all' },
];

const tool: ToolDefinition = {
  id: 'chmod-calculator',
  name: 'Chmod Calculator',
  description: 'Calculate Unix file permissions in octal and symbolic notation',
  category: 'devtools',
  keywords: ['chmod', 'permission', 'unix', 'linux', 'file', 'octal'],
  icon: 'FileKey',
  component: () => import('./ChmodCalculator'),
};

export default tool;
