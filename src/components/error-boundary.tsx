"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Label shown in the error panel — helps identify which section crashed */
  section?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface to console so developer tools / Sentry can pick it up
    console.error(`[ErrorBoundary${this.props.section ? ` in ${this.props.section}` : ""}]`, error, info);
  }

  reset() {
    this.setState({ hasError: false, error: undefined });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-800/40 bg-red-950/10 p-8 gap-4 text-center min-h-[200px]">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <div>
          <p className="text-sm font-medium text-red-300">
            {this.props.section ? `${this.props.section} crashed` : "Something went wrong"}
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs">
            {this.state.error?.message ?? "An unexpected error occurred"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => this.reset()}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      </div>
    );
  }
}
