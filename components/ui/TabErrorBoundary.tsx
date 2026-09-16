"use client";

import { Component, type ReactNode } from "react";

interface Props {
  tabName: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Wraps a single tab so a render error there can't take down the whole shell. */
export class TabErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.tabName}] tab crashed:`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-sm">
          <p className="font-medium text-[var(--danger)]">The {this.props.tabName} tab hit an error.</p>
          <p className="mt-1 text-[var(--foreground)]/70">{this.state.error.message}</p>
          <button
            className="mt-3 rounded border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--surface)]"
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
