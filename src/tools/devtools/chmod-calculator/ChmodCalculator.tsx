import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  chmodToOctal,
  chmodToSymbolic,
  octalToChmod,
  COMMON_PERMISSIONS,
  type ChmodState,
  type Permission,
} from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

const DEFAULT_STATE: ChmodState = {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  others: { read: true, write: false, execute: true },
};

export default function ChmodCalculator() {
  const { t } = useTranslation();
  const [state, setState] = useState<ChmodState>(DEFAULT_STATE);
  const [octalInput, setOctalInput] = useState('');

  const octal = chmodToOctal(state);
  const symbolic = chmodToSymbolic(state);
  const command = `chmod ${octal} filename`;

  const togglePerm = (role: keyof ChmodState, perm: keyof Permission) => {
    setState((prev) => ({
      ...prev,
      [role]: { ...prev[role], [perm]: !prev[role][perm] },
    }));
  };

  const handleOctalChange = (value: string) => {
    setOctalInput(value);
    if (/^[0-7]{3}$/.test(value)) {
      const parsed = octalToChmod(value);
      if (parsed) setState(parsed);
    }
  };

  const applyPreset = (preset: string) => {
    const parsed = octalToChmod(preset);
    if (parsed) {
      setState(parsed);
      setOctalInput('');
    }
  };

  const roles: (keyof ChmodState)[] = ['owner', 'group', 'others'];
  const perms: (keyof Permission)[] = ['read', 'write', 'execute'];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.chmodCalculator.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.chmodCalculator.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        {/* Permission matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted">
                <th className="text-left py-2 px-2 text-xs font-medium uppercase">{t('tools.chmodCalculator.role')}</th>
                {perms.map((p) => (
                  <th key={p} className="text-center py-2 px-4 text-xs font-medium uppercase">
                    {t(`tools.chmodCalculator.${p}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role} className="border-t border-border">
                  <td className="py-2 px-2 text-text-primary capitalize">{t(`tools.chmodCalculator.${role}`)}</td>
                  {perms.map((perm) => (
                    <td key={perm} className="text-center py-2 px-4">
                      <input
                        type="checkbox"
                        checked={state[role][perm]}
                        onChange={() => togglePerm(role, perm)}
                        className="rounded"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Octal input */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.chmodCalculator.octalInput')}
          </label>
          <input
            type="text"
            value={octalInput}
            onChange={(e) => handleOctalChange(e.target.value)}
            placeholder="e.g. 755"
            className="w-32 font-mono"
            maxLength={3}
          />
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-surface-alt">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-text-muted">{t('tools.chmodCalculator.octalLabel')}</p>
              <CopyButton text={octal} />
            </div>
            <p className="text-2xl font-mono font-bold text-text-primary">{octal}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-alt">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-text-muted">{t('tools.chmodCalculator.symbolicLabel')}</p>
              <CopyButton text={symbolic} />
            </div>
            <p className="text-lg font-mono text-text-primary">{symbolic}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-alt">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-text-muted">{t('tools.chmodCalculator.command')}</p>
              <CopyButton text={command} />
            </div>
            <p className="text-sm font-mono text-text-primary">{command}</p>
          </div>
        </div>

        {/* Common presets */}
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.chmodCalculator.commonPresets')}
          </label>
          <div className="space-y-1">
            {COMMON_PERMISSIONS.map((p) => (
              <div
                key={p.octal}
                className="flex items-center gap-3 p-2 rounded hover:bg-surface-alt cursor-pointer transition-colors"
                onClick={() => applyPreset(p.octal)}
              >
                <code className="text-sm font-mono text-accent">{p.octal}</code>
                <code className="text-sm font-mono text-text-muted">{p.symbolic}</code>
                <span className="text-sm text-text-secondary">{p.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
