import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({
  message,
  type = 'success', // success, error, warning, info
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: 'bg-emerald-50 border-emerald-250 text-emerald-800',
    error: 'bg-rose-50 border-rose-250 text-rose-800',
    warning: 'bg-amber-50 border-amber-250 text-amber-800',
    info: 'bg-sky-50 border-sky-250 text-sky-850',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
  };

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 shadow-md animate-slide-up ${styles[type]}`}>
      <div className="flex items-center gap-2.5">
        {icons[type]}
        <span className="text-sm font-semibold">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 transition-colors text-current focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
