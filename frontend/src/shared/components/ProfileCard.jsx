import React, { useState } from 'react';
import { MapPin, Phone, Mail, Calendar, Check, AlertCircle, ShieldAlert, Lock, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import sharedService from '../services/sharedService';
import ChatModal from './ChatModal';

export default function ProfileCard({ user, isMatchActive = false }) {
  const { user: currentUser } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (!user) return null;

  const isPatient = currentUser?.role === 'PATIENT';
  const isAdmin = currentUser?.role === 'ADMIN';
  const showFullContact = isAdmin || !isPatient || isMatchActive;

  const maskPhone = (phone) => {
    if (!phone) return '';
    return phone.slice(0, 3) + '******' + phone.slice(-2);
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length < 2) return email;
    const name = parts[0];
    const domain = parts[1];
    return name.slice(0, 2) + '***@' + domain;
  };

  const handleCallLog = async () => {
    try {
      await sharedService.logCall({
        caller_id: currentUser.id,
        receiver_id: user.id,
        request_id: 0, // General contact log
        call_type: "CALL_DONOR",
        status: "Completed"
      });
    } catch (err) {
      console.error("Failed to log call", err);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:shadow-md transition-all duration-200 text-left">
      <div className="flex gap-4 items-start md:items-center">
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
            <span className="absolute -bottom-1.5 -right-1.5 bg-red-600 text-white font-extrabold text-xs w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {user.blood_group}
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-lg font-bold text-slate-850 leading-tight">{user.full_name}</h4>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' :
              user.role === 'DONOR' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
            }`}>
              {user.role}
            </span>
            
            {user.role === 'DONOR' && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                user.availability ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-150 text-slate-500'
              }`}>
                {user.availability ? <Check className="w-3 h-3 animate-pulse" /> : <AlertCircle className="w-3 h-3" />}
                {user.availability ? 'Available' : 'Unavailable'}
              </span>
            )}

            {user.status === 'BANNED' && (
              <span className="text-[9px] px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Banned
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
            {user.division && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                {user.area ? `${user.area}, ` : ''}{user.district}, {user.division}
              </span>
            )}
            
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-450 shrink-0" />
              {showFullContact ? user.phone : maskPhone(user.phone)}
            </span>

            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-450 shrink-0" />
              {showFullContact ? user.email : maskEmail(user.email)}
            </span>
          </div>

          {user.role === 'DONOR' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 pt-1.5 border-t border-slate-100/60 text-xs font-semibold text-slate-500">
              <div>
                Total Donations: <span className="text-slate-700 font-extrabold">{user.donor_profile?.total_donations ?? 0} times</span>
              </div>
              <div>
                Last Donation: <span className="text-slate-700 font-extrabold">{user.donor_profile?.last_donation_date ?? 'Never'}</span>
              </div>
              {user.estimated_distance !== undefined && (
                <div>
                  Est. Proximity: <span className="text-slate-700 font-extrabold">{user.estimated_distance} km</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Direct Call / Chat / Lock Badge */}
      {isPatient && (
        <div className="shrink-0 self-start md:self-auto w-full md:w-auto">
          {isMatchActive ? (
            <div className="flex gap-2">
              <a
                href={`tel:${user.phone}`}
                onClick={handleCallLog}
                className="btn-secondary py-2 px-3 text-xs font-bold text-red-655 border-red-100 flex items-center gap-1"
              >
                <Phone className="w-4 h-4" /> Call
              </a>
              <button
                onClick={() => setIsChatOpen(true)}
                className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1"
              >
                <MessageSquare className="w-4 h-4" /> Chat Live
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start md:items-end gap-1">
              <span className="text-[10px] text-slate-450 font-bold flex items-center gap-1 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Communication Locked (Requires Request Match)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Chat modal overlay if match is active */}
      {isChatOpen && isMatchActive && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          requestId={0} // Will trigger matching conversation endpoint lookup on backend
          opponentId={user.id}
          opponentName={user.full_name}
        />
      )}
    </div>
  );
}
