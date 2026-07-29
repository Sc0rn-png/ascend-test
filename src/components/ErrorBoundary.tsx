import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ASCEND', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <h1 className="text-lg font-semibold">Quelque chose s'est mal passé</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Tes données sont intactes. Recharge la page pour repartir.
        </p>
        <code className="max-w-sm break-all rounded-lg bg-secondary p-3 text-left text-xs text-muted-foreground">
          {this.state.error.message}
        </code>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Recharger
        </button>
      </div>
    );
  }
}
