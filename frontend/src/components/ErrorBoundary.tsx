import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface State {
  hasError: boolean;
  message: string;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', err, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      this.props.fallback ?? (
        <div
          role="alert"
          className="max-w-md mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-md"
        >
          <h2 className="text-red-700 font-semibold">Something went wrong</h2>
          <p className="text-sm text-red-600 mt-2">{this.state.message}</p>
        </div>
      )
    );
  }
}
