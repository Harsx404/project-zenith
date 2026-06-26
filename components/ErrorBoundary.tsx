"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-950/20 text-red-500 p-8 text-center font-mono">
          <h2 className="text-xl font-bold mb-4 tracking-widest">ENGINE FAILURE</h2>
          <p className="mb-4">The Cesium 3D engine encountered a critical error during initialization.</p>
          <pre className="text-xs bg-black/50 p-4 rounded text-left overflow-auto max-w-full border border-red-500/20">
            {this.state.error?.message}
          </pre>
          <button 
            className="mt-6 px-6 py-2 border border-red-500/50 hover:bg-red-500/20 transition-colors tracking-widest"
            onClick={() => window.location.reload()}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
