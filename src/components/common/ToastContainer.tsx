import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { useToast } from '../../stores/toastStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle size={16} className="text-rose-400 shrink-0" />;
      default:
        return <Info size={16} className="text-blue-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-500/10';
      case 'warning':
        return 'border-amber-500/40 bg-amber-500/10';
      case 'error':
        return 'border-rose-500/40 bg-rose-500/10';
      default:
        return 'border-blue-500/40 bg-blue-500/10';
    }
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass-strong border shadow-xl backdrop-blur-md text-xs text-white font-medium ${getBorderColor(
              toast.type || 'info'
            )}`}
          >
            {getIcon(toast.type || 'info')}
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 p-0.5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
