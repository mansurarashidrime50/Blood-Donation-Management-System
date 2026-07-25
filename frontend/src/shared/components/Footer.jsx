import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-6">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
        <p className="text-sm font-semibold text-slate-500 flex items-center justify-center gap-1">
          Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for saving lives.
        </p>
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} শেষ আশা - Blood Donation Management System. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
