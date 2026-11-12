import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error in CV Studio React Tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleResetDraft = () => {
    try {
      localStorage.removeItem('curriculo_draft_v1');
    } catch {
      // Ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Recuperação do Estúdio de Currículo
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Ocorreu uma instabilidade pontual de renderização. Os seus dados guardados na nuvem e no navegador continuam em segurança.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-left overflow-x-auto text-[11px] font-mono text-slate-400 max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Estúdio</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetDraft}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar Rascunho</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
