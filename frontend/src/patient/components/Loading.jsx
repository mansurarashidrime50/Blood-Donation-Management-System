import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-4 w-full animate-pulse">
      {[1, 2, 3].map((n) => (
        <div key={n} className="glass-card p-6 bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-32" />
                <div className="h-3 bg-slate-200 rounded w-24" />
              </div>
            </div>
            <div className="h-6 bg-slate-200 rounded-full w-16" />
          </div>
          <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
