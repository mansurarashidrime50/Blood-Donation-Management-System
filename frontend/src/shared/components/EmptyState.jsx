import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = "No data available",
  message = "There are no records to show at the moment.",
  icon: Icon = Inbox
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-slate-200 bg-white rounded-2xl p-8 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 text-slate-450 border border-slate-100 shadow-sm">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-700 leading-tight mb-1">{title}</h3>
      <p className="text-xs font-semibold text-slate-450 leading-normal">{message}</p>
    </div>
  );
}
