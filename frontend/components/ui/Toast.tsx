'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastProps = {
  message: string;
  variant?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
};

const variantStyles: Record<NonNullable<ToastProps['variant']>, string> = {
  success: 'bg-emerald-500/15 border-emerald-400/20 text-emerald-100',
  error: 'bg-rose-500/15 border-rose-400/20 text-rose-100',
  info: 'bg-slate-800/90 border-white/10 text-slate-100',
};

type ToastContextType = {
  showToast: (message: string, variant?: ToastProps['variant']) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; variant: ToastProps['variant'] } | null>(null);

  const showToast = (message: string, variant: ToastProps['variant'] = 'info') => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div className={`rounded-[1.5rem] border px-4 py-3 text-sm shadow-lg ${variantStyles[toast.variant || 'info']}`}>
              {toast.message}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function Toast({ message, variant = 'info', onDismiss }: ToastProps) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-6 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-3xl border px-5 py-4 shadow-2xl shadow-black/20 ${variantStyles[variant]}`}
          role="status"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm leading-6">{message}</p>
            {onDismiss ? (
              <button type="button" onClick={onDismiss} className="text-sm text-slate-400 transition hover:text-white">
                Dismiss
              </button>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
