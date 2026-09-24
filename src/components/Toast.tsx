import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const config = {
    success: {
      bg: 'bg-emerald-950/90 border-emerald-600/50 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
    },
    danger: {
      bg: 'bg-rose-950/90 border-rose-600/50 text-rose-200',
      icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
    },
    warning: {
      bg: 'bg-amber-950/90 border-amber-600/50 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
    },
    info: {
      bg: 'bg-blue-950/90 border-blue-600/50 text-blue-200',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />
    }
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 ${config.bg}`}
    >
      {config.icon}
      <div className="flex-1 text-sm leading-snug">{toast.message}</div>
      <button
        onClick={onRemove}
        className="text-white/60 hover:text-white p-0.5 rounded transition-colors"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
