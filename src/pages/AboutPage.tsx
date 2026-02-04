import { useTranslation } from 'react-i18next';
import { Shield, Github, Globe, Lock } from 'lucide-react';

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary font-mono">
          <span className="text-accent">&gt;</span> {t('about.title')}
        </h1>
        <p className="text-text-secondary text-sm">
          {t('about.description')}
        </p>
      </div>

      <div className="grid gap-4">
        <InfoCard
          icon={<Globe size={20} />}
          title={t('about.offlineFirst')}
          description={t('about.offlineDesc')}
        />
        <InfoCard
          icon={<Lock size={20} />}
          title={t('about.privacy')}
          description={t('about.privacyDesc')}
        />
        <InfoCard
          icon={<Shield size={20} />}
          title={t('about.security')}
          description={t('about.securityDesc')}
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">{t('about.techStack')}</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            'React 19',
            'TypeScript',
            'Vite 6',
            'Tailwind CSS v4',
            'zustand',
            'React Router v7',
            'Web Crypto API',
            'Workbox PWA',
          ].map((tech) => (
            <div key={tech} className="flex items-center gap-2 text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              {tech}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">{t('about.openSource')}</h2>
        <p className="text-sm text-text-secondary">
          {t('about.openSourceDesc')}
        </p>
        <a
          href="https://github.com/401040579/dev-toolbox"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-border text-text-primary hover:border-accent hover:text-accent transition-colors"
        >
          <Github size={16} />
          {t('about.viewOnGithub')}
        </a>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border border-border bg-surface">
      <div className="p-2 rounded-md bg-accent-muted text-accent shrink-0 h-fit">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary mt-1">{description}</p>
      </div>
    </div>
  );
}
