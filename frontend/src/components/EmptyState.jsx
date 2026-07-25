import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function EmptyState({ title = 'No results found', message = 'Try adjusting your search filters or check back later.', actionButton }) {
  return (
    <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 border border-slate-200">
        <HelpCircle className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">{message}</p>
      {actionButton}
    </div>
  );
}
