import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, ArrowLeft } from 'lucide-react';

export default function ErrorPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-50 min-h-[calc(100vh-4rem)] animate-fade-in">
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-blood-50 rounded-3xl flex items-center justify-center border border-blood-100 shadow-sm animate-pulse-subtle mx-auto">
          <Droplet className="w-10 h-10 text-blood-500 fill-blood-500" />
        </div>
        <span className="absolute -top-2 -right-2 px-2.5 py-0.5 bg-slate-800 text-white text-xs font-extrabold rounded-full shadow-md">
          404
        </span>
      </div>

      <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
        Page Not Found
      </h1>
      
      <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed">
        The page you are looking for does not exist or has been relocated to another route endpoint.
      </p>

      <Link to="/" className="btn-primary inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Safety
      </Link>
    </div>
  );
}
