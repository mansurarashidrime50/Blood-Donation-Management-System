import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';

export default function ErrorComponent({
  title = "Something went wrong",
  message = "We encountered an error while loading the requested resources.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-rose-100 bg-rose-50/30 rounded-2xl p-8 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 text-rose-600 shadow-sm">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-800 leading-tight mb-1">{title}</h3>
      <p className="text-xs font-semibold text-rose-800 leading-normal mb-6">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={RotateCcw}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
