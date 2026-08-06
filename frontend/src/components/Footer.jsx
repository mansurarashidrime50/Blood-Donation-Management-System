import React from 'react';
import { Droplet, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blood-100 flex items-center justify-center">
            <Droplet className="w-5 h-5 text-blood-500 fill-blood-500" />
          </div>
          <span className="font-heading font-extrabold text-sm tracking-tight text-slate-700">
            শেষ আশা
          </span>
        </div>

        {/* Heart note */}
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <span>Made with</span>
          <Heart className="w-4 h-4 text-blood-500 fill-blood-500 animate-pulse-subtle" />
          <span>to save lives.</span>
        </div>

        {/* Links / Copyright */}
        <div className="text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} শেষ আশা Registry. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
