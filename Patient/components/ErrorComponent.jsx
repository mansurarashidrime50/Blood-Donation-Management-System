import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorComponent({ message, onRetry }) {
  return (
    <div className="glass-card p-6 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-sm animate-fade-in max-w-2xl mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="flex-1 text-center sm:text-left space-y-1">
        <h4 className="font-bold text-red-900">An Error Occurred</h4>
        <p className="text-sm text-red-700 font-medium">
          {message || 'We ran into a problem while processing your request. Please try again.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary py-2 px-4 bg-white hover:bg-slate-50 border-red-200 text-red-700 text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-200 cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}
