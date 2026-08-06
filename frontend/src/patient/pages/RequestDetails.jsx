import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Calendar, MapPin, Hospital, User, Phone, FileText, Activity, Clock } from 'lucide-react';
import usePatientRequests from '../hooks/usePatientRequests';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function RequestDetails() {
  const { id } = useParams();
  const { currentRequest, fetchRequest, deleteRequest, loading, error } = usePatientRequests();
  const navigate = useNavigate();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const loadRequest = async () => {
      try {
        await fetchRequest(id);
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    };
    loadRequest();
  }, [id, fetchRequest]);

  const handleDeleteConfirm = async () => {
    if (!currentRequest) return;
    setIsDeleting(true);
    try {
      await deleteRequest(currentRequest.id);
      setIsDeleteModalOpen(false);
      navigate('/patient/requests');
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

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
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isFetching) {
    return (
      <div className="flex-1 py-16 flex items-center justify-center">
        <LoadingSpinner fullPage={false} />
      </div>
    );
  }

  if (!currentRequest && error) {
    return (
      <div className="flex-1 py-10 px-4 max-w-3xl mx-auto">
        <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center space-y-4 shadow-sm">
          <h2 className="text-lg font-bold">Request details unavailable</h2>
          <p className="text-sm font-medium">{error}</p>
          <Link to="/patient/requests" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-650 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  if (!currentRequest) return null;

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
        
        {/* Navigation Breadcrumb Link */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/patient/requests"
            className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
          
          <div className="flex gap-2">
            <Link
              to={`/patient/requests/${currentRequest.id}/edit`}
              className="btn-secondary py-2 px-3 text-xs justify-center flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Request
            </Link>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="btn-danger py-2 px-3 text-xs justify-center flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Request
            </button>
          </div>
        </div>

        {/* Detailed Medical Card Container */}
        <div className="glass-card bg-white shadow-sm border border-slate-100 rounded-2xl p-8 relative overflow-hidden">
          {/* Top colored status ribbon */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
            currentRequest.emergency_level === 'Critical'
              ? 'bg-red-500'
              : currentRequest.emergency_level === 'Urgent'
              ? 'bg-amber-500'
              : 'bg-blue-500'
          }`} />

          {/* Title Segment */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-blood-50 border border-blood-200 text-blood-600 font-extrabold text-3xl flex items-center justify-center shadow-inner shrink-0">
                {currentRequest.blood_group_required}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Blood Request Details</h1>
                <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Status: 
                  <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${getStatusBadge(currentRequest.request_status)}`}>
                    {currentRequest.request_status}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emergency Level</span>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${getEmergencyBadge(currentRequest.emergency_level)}`}>
                {currentRequest.emergency_level}
              </span>
            </div>
          </div>

          {/* Vitals and Details Grid */}
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2 mb-4">
                Patient & Case Details
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Patient Name</span>
                  <p className="text-slate-700 font-semibold mt-0.5">{currentRequest.patient_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Units Needed</span>
                  <p className="text-slate-700 font-semibold mt-0.5">
                    <span className="text-blood-600 font-bold text-base">{currentRequest.blood_units_needed}</span> Unit(s)
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Required Date</span>
                  <p className="text-slate-700 font-semibold mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {formatDate(currentRequest.required_date)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Contact Number</span>
                  <p className="text-slate-700 font-semibold mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {currentRequest.contact_number}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2 mb-4">
                Hospital & Location Address
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Hospital Facility</span>
                  <p className="text-slate-700 font-semibold mt-0.5 flex items-start gap-1.5">
                    <Hospital className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    {currentRequest.hospital_name}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Division</span>
                  <p className="text-slate-700 font-semibold mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {currentRequest.division}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">District</span>
                  <p className="text-slate-700 font-semibold mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {currentRequest.district}
                  </p>
                </div>
              </div>
            </div>

            {currentRequest.additional_notes && (
              <div>
                <h2 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2 mb-3">
                  Additional Case Notes
                </h2>
                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 flex items-start gap-3 border border-slate-100">
                  <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed whitespace-pre-wrap">{currentRequest.additional_notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Dialog */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          requestName={currentRequest.patient_name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsDeleteModalOpen(false)}
          isLoading={isDeleting}
        />

      </div>
    </div>
  );
}
