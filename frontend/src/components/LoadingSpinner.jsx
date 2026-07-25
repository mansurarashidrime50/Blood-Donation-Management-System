import React from 'react';
import { Droplet } from 'lucide-react';

export default function LoadingSpinner({ fullPage = false }) {
  const spinnerContent = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center">
        {/* Animated outer ring */}
        <div className="w-16 h-16 rounded-full border-4 border-blood-100 border-t-blood-500 animate-spin" />
        {/* Center blood icon */}
        <Droplet className="absolute w-6 h-6 text-blood-500 fill-blood-500 animate-pulse-subtle" />
      </div>
      <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">
        Loading...
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="w-full py-12 flex items-center justify-center">
      {spinnerContent}
    </div>
  );
}
