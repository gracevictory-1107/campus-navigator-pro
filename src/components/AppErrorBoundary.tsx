import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "The application encountered an unexpected error.",
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("AWDC Campus Navigator runtime error:", error, info);
    }
  }

  reload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-elevated" role="alert">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <span className="text-xl font-bold">!</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Campus Navigator needs to restart</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            An unexpected application error occurred. Your saved campus data remains in the configured browser/database storage.
          </p>
          {import.meta.env.DEV && (
            <p className="mt-3 rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground break-words">{this.state.message}</p>
          )}
          <button
            type="button"
            onClick={this.reload}
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Reload Navigator
          </button>
        </section>
      </main>
    );
  }
}
