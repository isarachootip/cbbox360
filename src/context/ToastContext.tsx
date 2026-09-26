import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'info' | 'error';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => {
          let bg = 'bg-white border-border text-text-primary shadow-lg';
          let icon = <Info className="w-4 h-4 text-brand flex-shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-white border-emerald-300 text-emerald-900 shadow-lg';
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-warn-bg border-warn-border text-warn-text shadow-lg';
            icon = <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
          } else if (toast.type === 'error') {
            bg = 'bg-danger-bg border-danger-border text-danger-text shadow-lg';
            icon = <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-[13px] font-medium transition-all transform translate-y-0 ${bg}`}
            >
              <div className="flex items-center gap-2">
                {icon}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-text-secondary hover:text-text-primary p-0.5"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
