import React from 'react';
import { MapPin, Phone, Mail, Calendar, Check, AlertCircle, ShieldAlert } from 'lucide-react';

export default function ProfileCard({ user, onActionClick, actionText, actionIcon: ActionIcon }) {
  if (!user) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:shadow-md transition-all duration-200">
      <div className="flex gap-4 items-center">
        {/* Avatar with Blood Group Indicator */}
        <div className="relative shrink-0">
          {user.profile_image ? (
            <img
              src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.profile_image}`}
              alt={user.full_name}
              className="w-16 h-16 rounded-full object-cover border border-slate-200"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'; }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-xl">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          
          {user.blood_group && (
            <span className="absolute -bottom-1.5 -right-1.5 bg-red-650 text-white font-extrabold text-xs w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {user.blood_group}
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-lg font-bold text-slate-800 leading-tight">{user.full_name}</h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' :
              user.role === 'DONOR' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
            }`}>
              {user.role}
            </span>
            
            {user.role === 'DONOR' && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                user.availability ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {user.availability ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {user.availability ? 'Available' : 'Unavailable'}
              </span>
            )}

            {user.status === 'BANNED' && (
              <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Banned
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
            {user.division && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {user.area ? `${user.area}, ` : ''}{user.district}, {user.division}
              </span>
            )}
            
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {user.phone}
            </span>

            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {user.email}
            </span>
          </div>

          {user.role === 'DONOR' && user.last_donation_date && (
            <div className="text-xs text-slate-450 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Last donation: <span className="text-slate-600 font-semibold">{user.last_donation_date}</span>
            </div>
          )}
        </div>
      </div>

      {/* Optional action button */}
      {onActionClick && actionText && (
        <button
          onClick={onActionClick}
          className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 self-start md:self-auto"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {actionText}
        </button>
      )}
    </div>
  );
}
