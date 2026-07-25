import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Plus } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="glass-card p-12 bg-white text-center border border-slate-100 shadow-sm rounded-2xl flex flex-col items-center justify-center max-w-lg mx-auto my-8 animate-slide-up">
      <div className="w-16 h-16 rounded-2xl bg-blood-50 text-blood-500 flex items-center justify-center mb-5">
        <Inbox className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">No Blood Requests Found</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-sm">
        You haven't posted any blood requests yet. If you or a loved one requires blood donations, create a request now to reach available donors.
      </p>
      <Link to="/patient/requests/create" className="btn-primary py-2.5 px-5 text-sm flex items-center gap-1.5 shadow-sm">
        <Plus className="w-4.5 h-4.5" />
        Create Blood Request
      </Link>
    </div>
  );
}
