import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Hospital, User, Phone, Eye, Edit2, Trash2 } from 'lucide-react';

export default function BloodRequestCard({ request, onDeleteClick }) {
  const getEmergencyBadge = (level) => {
    switch (level) {
      case 'Critical':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'Urgent':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Normal':
      default:
        return 'bg-blue-50 text-blue-700 border border-blue-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Fulfilled':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-500 border border-slate-200';
      case 'Pending':
      default:
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col md:flex-row gap-5 items-start md:items-center relative group overflow-hidden transition-all duration-300 hover:shadow-md animate-slide-up">
      {/* Accent left indicator */}
      <div className={`absolute top-0 left-0 bottom-0 w-1.5 transition-colors duration-300 ${
        request.emergency_level === 'Critical'
          ? 'bg-red-500'
          : request.emergency_level === 'Urgent'
          ? 'bg-amber-500'
          : 'bg-blue-500'
      }`} />

      {/* Blood Group Display */}
      <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-blood-50 border border-blood-200 text-blood-600 font-extrabold text-2xl relative shadow-inner mx-auto md:mx-0">
        {request.blood_group_required}
      </div>

      {/* Request Details */}
      <div className="flex-1 w-full space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex flex-wrap items-center gap-2">
              <span>Request for {request.patient_name}</span>
              <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full ${getEmergencyBadge(request.emergency_level)}`}>
                {request.emergency_level}
              </span>
            </h3>
            <p className="text-sm text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
              <Hospital className="w-4 h-4 text-slate-400" />
              {request.hospital_name}
            </p>
          </div>
          <div className="shrink-0">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getStatusBadge(request.request_status)}`}>
              {request.request_status}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 pt-3 border-t border-slate-50 text-xs text-slate-650 font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Needed by: <strong>{formatDate(request.required_date)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>Location: <strong>{request.district}, {request.division}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-400" />
            <span>Units needed: <strong className="text-blood-600 font-bold">{request.blood_units_needed}</strong></span>
          </div>
        </div>

        {/* Contact Info Preview if visible */}
        {request.contact_number && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>Contact: <strong>{request.contact_number}</strong></span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-4">
        <Link
          to={`/patient/requests/${request.id}`}
          className="btn-secondary py-2 px-3 text-xs w-full justify-center flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200"
        >
          <Eye className="w-3.5 h-3.5" />
          Details
        </Link>
        <Link
          to={`/patient/requests/${request.id}/edit`}
          className="btn-secondary py-2 px-3 text-xs w-full justify-center flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Edit
        </Link>
        <button
          onClick={() => onDeleteClick(request)}
          className="btn-danger py-2 px-3 text-xs w-full justify-center flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
