import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryState {
  error: string;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatal-error">
          <h1>Schlieren renderer stopped</h1>
          <p>{this.state.error}</p>
        </main>
      );
    }

    return this.props.children;
  }
}
