import React from 'react';
import { Droplet } from 'lucide-react';

export default function Loader({ fullPage = false, text = 'Loading...' }) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin" />
          <Droplet className="w-6 h-6 text-red-600 fill-red-600 absolute animate-pulse" />
        </div>
        <p className="text-sm font-bold text-slate-500 tracking-wider uppercase animate-pulse">
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-slate-150 border-t-red-600 animate-spin" />
      </div>
      <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider">{text}</p>
    </div>
  );
}
