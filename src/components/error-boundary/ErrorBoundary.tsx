import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryImpl extends Component<Props & { defaultTitle: string; defaultMessage: string; retryLabel: string }, State> {
  constructor(props: Props & { defaultTitle: string; defaultMessage: string; retryLabel: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="p-3 rounded-full bg-error/10 text-error mb-4">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-1">
            {this.props.fallbackTitle || this.props.defaultTitle}
          </h2>
          <p className="text-sm text-text-secondary mb-4 max-w-md">
            {this.props.defaultMessage}
          </p>
          {this.state.error?.message && <pre className="text-xs text-text-muted mb-4 max-w-md whitespace-pre-wrap break-all">{this.state.error.message}</pre>}
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-accent text-background hover:bg-accent-hover transition-colors"
          >
            <RotateCcw size={14} />
            {this.props.retryLabel}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary(props: Props) {
  const { t } = useTranslation();
  return <ErrorBoundaryImpl {...props} defaultTitle={t('common.somethingWrong')} defaultMessage={t('common.unexpectedError')} retryLabel={t('common.tryAgain')} />;
}
