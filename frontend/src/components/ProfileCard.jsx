import React from 'react';
import { Phone, MapPin, Calendar, Activity, Info, User } from 'lucide-react';

export default function ProfileCard({ donor, isPrivate = false, onEdit, onDelete }) {
  const getBloodBadgeColor = (group) => {
    return 'bg-blood-50 text-blood-600 border border-blood-200';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never / First Time';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch {
      return dateStr;
    }
  };

  const imageSrc = donor.profile_image
    ? donor.profile_image.startsWith('/')
      ? `http://localhost:8000${donor.profile_image}`
      : donor.profile_image
    : null;

  return (
    <div className="glass-card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative group overflow-hidden transition-all duration-300 hover:shadow-md animate-slide-up">
      {/* Decorative accent bar */}
      <div className={`absolute top-0 left-0 bottom-0 w-1.5 transition-colors duration-300 ${
        donor.availability ? 'bg-emerald-500' : 'bg-slate-300'
      }`} />

      {/* Avatar Image */}
      <div className="relative shrink-0 mx-auto md:mx-0">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={donor.full_name}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <User className="w-12 h-12" />
          </div>
        )}
        
        {/* Availability Badge Overlay */}
        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
          donor.availability ? 'bg-emerald-500 animate-pulse-subtle' : 'bg-slate-400'
        }`} title={donor.availability ? 'Available for donation' : 'Currently Unavailable'} />
      </div>

      {/* Details Container */}
      <div className="flex-1 w-full space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {donor.full_name}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${getBloodBadgeColor(donor.blood_group)}`}>
                {donor.blood_group}
              </span>
            </h3>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {donor.area}, {donor.district}, {donor.division}
            </p>
          </div>

          <div className="text-right sm:text-right">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              donor.availability 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              {donor.availability ? 'Available Now' : 'Unavailable'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-slate-50 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Last Donated: <strong className="text-slate-800">{formatDate(donor.last_donation_date)}</strong></span>
          </div>

          {donor.weight && (
            <div className="flex items-center gap-2 text-slate-600">
              <Activity className="w-4 h-4 text-slate-400" />
              <span>Weight: <strong className="text-slate-800">{donor.weight} kg</strong></span>
            </div>
          )}

          {donor.phone && (
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>Phone: <strong className="text-slate-800">{donor.phone}</strong></span>
            </div>
          )}
        </div>

        {donor.medical_conditions && (
          <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 flex items-start gap-2 border border-slate-100">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Medical Information:</strong> {donor.medical_conditions}
            </span>
          </div>
        )}
      </div>

      {/* Admin actions (Edit / Delete buttons on Dashboard) */}
      {isPrivate && (
        <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4">
          <button
            onClick={onEdit}
            className="btn-secondary py-2 px-3 text-xs w-full justify-center"
          >
            Edit Profile
          </button>
          <button
            onClick={onDelete}
            className="btn-danger py-2 px-3 text-xs w-full justify-center"
          >
            Delete Account
          </button>
        </div>
      )}
    </div>
  );
}
