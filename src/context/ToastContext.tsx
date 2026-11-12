import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  XCircle,
  Sparkles,
  Zap
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  showSuccess: (title: string, message: string, duration?: number) => string;
  showError: (title: string, message: string, duration?: number) => string;
  showInfo: (title: string, message: string, duration?: number) => string;
  showWarning: (title: string, message: string, duration?: number) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Individual Toast Notification Item with animation and auto-dismiss progress bar
const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss
}) => {
  const duration = toast.duration ?? 4500;
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    if (duration <= 0) return;

    const dismissTimer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    const interval = 25; // 25ms tick
    const decrement = (interval / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - decrement));
    }, interval);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(progressTimer);
    };
  }, [duration, onDismiss, toast.id]);

  const typeConfig = {
    success: {
      bg: 'bg-white border-emerald-300 shadow-emerald-500/10 text-slate-900',
      iconBg: 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200/60',
      icon: <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />,
      progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      badge: 'Sucesso',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    error: {
      bg: 'bg-white border-rose-300 shadow-rose-500/10 text-slate-900',
      iconBg: 'bg-rose-100 text-rose-700 ring-2 ring-rose-200/60',
      icon: <XCircle className="w-5 h-5 shrink-0 text-rose-600" />,
      progressBar: 'bg-gradient-to-r from-rose-500 to-red-500',
      badge: 'Erro',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200'
    },
    warning: {
      bg: 'bg-white border-amber-300 shadow-amber-500/10 text-slate-900',
      iconBg: 'bg-amber-100 text-amber-700 ring-2 ring-amber-200/60',
      icon: <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />,
      progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      badge: 'Aviso',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-200'
    },
    info: {
      bg: 'bg-white border-indigo-300 shadow-indigo-500/10 text-slate-900',
      iconBg: 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200/60',
      icon: <Info className="w-5 h-5 shrink-0 text-indigo-600" />,
      progressBar: 'bg-gradient-to-r from-indigo-500 to-blue-500',
      badge: 'Informação',
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    }
  }[toast.type];

  return (
    <div
      role="alert"
      className={`relative overflow-hidden rounded-2xl border shadow-xl p-4 transition-all duration-300 ease-out transform translate-y-0 opacity-100 animate-in slide-in-from-bottom-5 fade-in max-w-md w-full ${typeConfig.bg}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon stamp */}
        <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${typeConfig.iconBg}`}>
          {typeConfig.icon}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md border ${typeConfig.badgeClass}`}>
              {typeConfig.badge}
            </span>
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {toast.title}
            </h4>
          </div>
          <p className="text-[11.5px] text-slate-600 leading-relaxed break-words">
            {toast.message}
          </p>

          {/* Optional Action Button */}
          {toast.action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors shadow-2xs"
              >
                <span>{toast.action.label}</span>
              </button>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-lg transition-colors shrink-0"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-Dismiss Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 linear ${typeConfig.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const showSuccess = useCallback((title: string, message: string, duration = 4500): string => {
    return showToast({ type: 'success', title, message, duration });
  }, [showToast]);

  const showError = useCallback((title: string, message: string, duration = 5000): string => {
    return showToast({ type: 'error', title, message, duration });
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string, duration = 4000): string => {
    return showToast({ type: 'info', title, message, duration });
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string, duration = 4500): string => {
    return showToast({ type: 'warning', title, message, duration });
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeToast
      }}
    >
      {children}

      {/* Toast Notification Container (Floating stack) */}
      <div
        aria-live="polite"
        className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm sm:max-w-md w-auto"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastCard toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
};
