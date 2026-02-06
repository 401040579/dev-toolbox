import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TEMPLATES } from './index';
import { CopyButton } from '@/components/copy-button/CopyButton';

export default function DockerCompose() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);
  const [customYaml, setCustomYaml] = useState('');

  const template = TEMPLATES[selected]!;
  const displayYaml = customYaml || template.yaml;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">{t('tools.dockerCompose.title')}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t('tools.dockerCompose.description')}</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {t('tools.dockerCompose.selectTemplate')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TEMPLATES.map((tmpl, i) => (
              <button
                key={i}
                onClick={() => { setSelected(i); setCustomYaml(''); }}
                className={`p-3 rounded-lg text-left border transition-colors ${
                  selected === i
                    ? 'border-accent bg-accent-muted'
                    : 'border-border hover:border-accent'
                }`}
              >
                <p className="text-sm font-medium text-text-primary">{tmpl.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{tmpl.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
              docker-compose.yml
            </label>
            <CopyButton text={displayYaml} />
          </div>
          <textarea
            value={displayYaml}
            onChange={(e) => setCustomYaml(e.target.value)}
            className="w-full h-80 resize-none font-mono text-xs"
          />
        </div>
      </div>
    </div>
  );
}
