import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  isSection?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReset = () => {
    try {
      // Clear navigation cache keys while preserving user's database links
      const keysToClear = [
        "cpa_last_active_tab",
        "cpa_treinamento_active_subtab",
        "cpa_prompt_active_submenu",
        "cpa_tools_active_subtab",
        "treinamento_pc_checks",
      ];
      keysToClear.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.error("Error clearing cache:", e);
    }
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.isSection) {
        return (
          <div className="p-6 my-4 bg-amber-50/80 border border-amber-200 rounded-xl text-slate-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-amber-900 text-sm">
                  {this.props.fallbackTitle || "Falha ao carregar esta seção"}
                </h4>
                <p className="text-xs text-amber-700 mt-1">
                  Ocorreu um erro temporário de renderização. O restante do aplicativo continua funcionando normalmente.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={this.handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Tentar Novamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-slate-900">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Recuperação do Sistema
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              A tela anterior encontrou um erro inesperado. Seus dados no banco continuam preservados.
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 bg-slate-100 rounded-lg text-left text-xs font-mono text-slate-700 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Recarregar Página
              </button>
              <button
                onClick={this.handleClearCacheAndReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Restaurar Padrão
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
