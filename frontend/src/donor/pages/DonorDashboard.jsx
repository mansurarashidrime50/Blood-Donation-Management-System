import React, { useState, useEffect, useCallback } from 'react';
import { 
  Heart, Calendar, MapPin, CheckCircle2, AlertTriangle, MessageSquare, 
  Phone, Send, Clock, Check, X, ShieldAlert, Loader2, Sparkles
} from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import Button from '../../shared/components/Button';
import Toast from '../../shared/components/Toast';
import donorService from '../services/donorService';
import patientService from '../../patient/services/patientService';
import sharedService from '../../shared/services/sharedService';
import ChatModal from '../../shared/components/ChatModal';

const DIVISION_DISTRICTS = {
  'Dhaka': ['Dhaka', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur'],
  'Chattogram': ['Chattogram', 'Cox\'s Bazar', 'Feni', 'Cumilla', 'Noakhali'],
  'Sylhet': ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  'Rajshahi': ['Rajshahi', 'Bogra', 'Pabna', 'Naogaon'],
  'Khulna': ['Khulna', 'Jashore', 'Kushtia', 'Satkhira'],
  'Barishal': ['Barishal', 'Bhola', 'Patuakhali'],
  'Rangpur': ['Rangpur', 'Dinajpur', 'Gaibandha'],
  'Mymensingh': ['Mymensingh', 'Netrokona', 'Sherpur']
};

export default function DonorDashboard() {
  const { user, updateProfile } = useAuth();
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingFeeds, setLoadingFeeds] = useState(true);

  // Form states
  const [availability, setAvailability] = useState(user?.availability ?? true);
  const [lastDonationDate, setLastDonationDate] = useState(user?.last_donation_date ?? '');
  const [division, setDivision] = useState(user?.division ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [area, setArea] = useState(user?.area ?? '');

  // Feed states
  const [criticalRequests, setCriticalRequests] = useState([]);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [activeDonation, setActiveDonation] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Sync profile details
  useEffect(() => {
    if (user) {
      setAvailability(user.availability);
      setLastDonationDate(user.last_donation_date ?? '');
      setDivision(user.division ?? '');
      setDistrict(user.district ?? '');
      setArea(user.area ?? '');
    }
  }, [user]);

  const fetchDashboardFeeds = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Fetch nearby compatible requests
      const compatibleRes = await donorService.getCompatibleRequests();
      setCriticalRequests(compatibleRes.data.critical_requests || []);
      setNearbyRequests(compatibleRes.data.nearby_requests || []);

      // 2. Fetch history to find active accepted donation
      const historyRes = await donorService.getHistory({ limit: 20 });
      const active = (historyRes.data.items || []).find(
        d => ['Accepted', 'Approved', 'Confirmed', 'Donation Completed', 'Waiting Verification'].includes(d.status)
      );
      
      if (active) {
        setActiveDonation(active);
        // Fetch matching request details
        const reqRes = await donorService.getRequest(active.request_id);
        setActiveRequest(reqRes.data);
        
        // Fetch proposed meeting
        try {
          const meetingRes = await patientService.getRequestMeeting(active.request_id);
          setActiveMeeting(meetingRes.data || null);
        } catch (meetErr) {
          setActiveMeeting(null);
        }
      } else {
        setActiveDonation(null);
        setActiveRequest(null);
        setActiveMeeting(null);
      }
    } catch (err) {
      console.error("Failed to load dashboard feeds", err);
    } finally {
      setLoadingFeeds(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardFeeds();
    const interval = setInterval(fetchDashboardFeeds, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboardFeeds]);

  const handleDivisionChange = (e) => {
    const newDiv = e.target.value;
    setDivision(newDiv);
    setDistrict('');
  };

  const getNextEligibleDate = (lastDateStr) => {
    if (!lastDateStr) return 'Immediately (No prior donation logged)';
    const lastDate = new Date(lastDateStr);
    if (isNaN(lastDate.getTime())) return 'Immediately';
    const nextDate = new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    const today = new Date();
    if (nextDate <= today) return 'Eligible now (90 days elapsed)';
    return nextDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isEligibleNow = (lastDateStr) => {
    if (!lastDateStr) return true;
    const lastDate = new Date(lastDateStr);
    if (isNaN(lastDate.getTime())) return true;
    const nextDate = new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    const today = new Date();
    return nextDate <= today;
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile({
        availability,
        last_donation_date: lastDonationDate || null,
        division,
        district,
        area
      });
      setToast({ type: 'success', message: "Donation status and area parameters successfully updated!" });
      fetchDashboardFeeds();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to update your donor status parameters." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setActionLoading(true);
    try {
      await donorService.acceptRequest(requestId);
      setToast({ type: 'success', message: "Blood request accepted! You are now reserved. Coordinate with patient below." });
      fetchDashboardFeeds();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to accept blood request." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmMeeting = async () => {
    if (!activeRequest) return;
    setActionLoading(true);
    try {
      await donorService.confirmMeeting(activeRequest.id);
      setToast({ type: 'success', message: "Donation meeting confirmed successfully!" });
      fetchDashboardFeeds();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to confirm meeting." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteDonation = async () => {
    if (!activeRequest) return;
    setActionLoading(true);
    try {
      await donorService.completeDonation(activeRequest.id);
      setToast({ type: 'success', message: "Thank you! Donation logged. Awaiting patient confirmation and Admin verification." });
      fetchDashboardFeeds();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to mark donation completed." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDonation = async () => {
    if (!activeDonation) return;
    setActionLoading(true);
    try {
      await donorService.cancelDonation(activeDonation.id);
      setToast({ type: 'success', message: "Donation cancelled successfully. Your status is now set to Available." });
      fetchDashboardFeeds();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to cancel donation." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    setActionLoading(true);
    try {
      await donorService.declineRequest(requestId);
      setToast({ type: 'success', message: "Blood request declined. It will no longer show on your feed." });
      fetchDashboardFeeds();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to decline request." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallPatientLog = async () => {
    if (!activeRequest) return;
    try {
      await sharedService.logCall({
        caller_id: user.id,
        receiver_id: activeRequest.patient_id,
        request_id: activeRequest.id,
        call_type: "CALL_PATIENT",
        status: "Completed"
      });
    } catch (err) {
      console.error("Failed to log call", err);
    }
  };

  const handleCallPatientCardLog = async (req) => {
    try {
      await sharedService.logCall({
        caller_id: user.id,
        receiver_id: req.patient_id,
        request_id: req.id,
        call_type: "CALL_PATIENT",
        status: "Completed"
      });
    } catch (err) {
      console.error("Failed to log call", err);
    }
  };

  const handleCallPatient = (req) => {
    if (activeRequest && activeRequest.id === req.id) {
      handleCallPatientCardLog(req);
      window.location.href = `tel:${req.contact_number}`;
    } else {
      setToast({
        type: 'warning',
        message: 'You must accept this blood request first to call the patient.'
      });
    }
  };

  const handleMessagePatient = (req) => {
    if (activeRequest && activeRequest.id === req.id) {
      setIsChatOpen(true);
    } else {
      setToast({
        type: 'warning',
        message: 'You must accept this blood request first to message the patient.'
      });
    }
  };

  return (
    <div className="space-y-8 animate-slide-up text-left max-w-5xl mx-auto pb-16">
      {toast && (
        <div className="fixed top-4 right-4 z-50 min-w-[320px]">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            Welcome, {user?.full_name || 'Donor'}
            <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-750 text-xs font-black uppercase tracking-wider rounded-full border border-red-200">
              Donor
            </span>
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-0.5">Manage availability status, review emergency request alerts, and coordinate with recipients</p>
        </div>
      </div>

      {/* Overview Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${availability ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
            <Heart className="w-6 h-6 fill-current animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Availability Status</span>
            <div className={`text-sm font-black mt-1 ${availability ? 'text-emerald-650' : 'text-slate-500'}`}>
              {availability ? 'ACTIVE & ONLINE' : 'OFFLINE / INACTIVE'}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-650 rounded-xl shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Eligible Date</span>
            <div className="text-[11px] font-black text-slate-800 mt-1.5">
              {getNextEligibleDate(lastDonationDate)}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Area</span>
            <div className="text-xs font-black text-slate-800 mt-1 truncate max-w-[180px]">
              {area ? `${area}, ` : ''}{district ? `${district}` : 'Not Specified'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Feed: Active Accepted requests, proximity updates, nearby alerts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active coordination section */}
          {activeRequest && activeDonation ? (
            <div className="bg-white border-2 border-red-500/30 rounded-3xl p-6 shadow-md space-y-6 relative overflow-hidden animate-slide-up">
              <div className="absolute top-0 right-0 bg-red-500 text-white font-extrabold text-[9px] uppercase py-1 px-4 rounded-bl-xl tracking-wider">
                Active Match
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recipient Coordination Portal</span>
                <h3 className="text-xl font-extrabold text-slate-800 mt-2">Emergency Blood Request for {activeRequest.patient_name}</h3>
                <span className="text-xs text-slate-450 font-semibold mt-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  {activeRequest.hospital_name}
                </span>
              </div>

              {/* Proximity / Distance info */}
              <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-4 text-xs font-semibold text-slate-655 bg-slate-50/50 rounded-xl px-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Distance</span>
                  <span className="text-slate-800 font-bold">{activeRequest.distance || '12.4'} km</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">ETA</span>
                  <span className="text-slate-800 font-bold">25 mins</span>
                </div>
              </div>

              {/* Step 8 Proposed Meeting */}
              {activeMeeting ? (
                <div className="p-4 bg-red-50/30 border border-red-100 rounded-2xl space-y-3">
                  <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider block">Proposed Meeting Schedule</span>
                  <div className="text-xs font-semibold text-slate-700 space-y-1">
                    <p>📍 Location: <strong>{activeMeeting.meeting_location}</strong></p>
                    <p>🕒 Time: <strong>{new Date(activeMeeting.meeting_time).toLocaleString()}</strong></p>
                  </div>
                  
                  {activeMeeting.status === 'Pending' ? (
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={handleConfirmMeeting}
                        disabled={actionLoading}
                        className="btn-primary py-2 px-4 text-xs font-bold bg-red-500 hover:bg-red-655"
                      >
                        {actionLoading ? "Confirming..." : "Confirm Proposal"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs pt-1">
                      <Check className="w-4 h-4" /> Meeting details confirmed. Propose new schedule if needed on chat.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 text-xs font-semibold">
                  ⏳ Waiting for patient to schedule meeting details (time/bed location).
                </div>
              )}

              {/* Direct Actions Toolbar */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="flex items-center gap-2 btn-primary bg-slate-900 hover:bg-slate-850 text-xs py-2 px-4 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" /> Chat Live
                </button>
                <a
                  href={`https://wa.me/${activeRequest.patient_phone || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 btn-secondary hover:bg-emerald-50 text-xs py-2 px-4 text-emerald-600 border-emerald-100 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-emerald-500 fill-emerald-500" /> WhatsApp
                </a>
                <a
                  href={`tel:${activeRequest.contact_number || ''}`}
                  onClick={handleCallPatientLog}
                  className="flex items-center gap-2 btn-secondary hover:bg-red-50 text-xs py-2 px-4 text-red-655 border-red-100 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-red-500 fill-red-500" /> Call Patient
                </a>
              </div>

              {/* Step 9 Complete Donation Button */}
              {activeMeeting && activeMeeting.status === 'Confirmed' && !activeDonation.donor_completed && (
                <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <p className="text-xs text-slate-450 font-semibold">Ready to donate? Click once you complete blood extraction.</p>
                  <button
                    onClick={handleCompleteDonation}
                    disabled={actionLoading}
                    className="btn-primary py-2.5 px-6 text-xs bg-emerald-500 hover:bg-emerald-600 shadow-none cursor-pointer"
                  >
                    {actionLoading ? "Processing..." : "Donation Completed"}
                  </button>
                </div>
              )}

              {activeDonation.donor_completed && (
                <div className="p-3.5 bg-yellow-50/50 border border-yellow-150 rounded-xl text-xs font-semibold text-yellow-800">
                  ⌛ Donation completed by you. Waiting for patient to confirm receipt and Admin verification.
                </div>
              )}

              {/* Cancel Button */}
              {!activeDonation.donor_completed && (
                <div className="flex justify-end border-t border-slate-50 pt-3">
                  <button
                    onClick={handleCancelDonation}
                    disabled={actionLoading}
                    className="text-[10px] text-red-600 hover:underline font-bold"
                  >
                    Cancel Match (Release Request)
                  </button>
                </div>
              )}

            </div>
          ) : null}

          {/* Critical Blood Requests Feed */}
          {criticalRequests.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-50 pb-3">
                <h3 className="text-lg font-extrabold text-red-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  🚨 Critical Blood Requests
                </h3>
                <p className="text-xs text-slate-450 mt-1">High priority requests requiring immediate attention</p>
              </div>

              <div className="divide-y divide-slate-50">
                {criticalRequests.map((req) => (
                  <div key={req.id} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50/20 transition-colors rounded-xl px-2">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-800">{req.patient_name}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-red-100 text-red-800">
                          Critical
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600 font-medium">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Hospital: <strong>{req.hospital_name} {req.hospital_location ? `- ${req.hospital_location}` : ''}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Location: <strong>{req.district}, {req.division}</strong> ({req.distance !== undefined ? `${req.distance} km` : 'N/A'})</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Date: <strong>{req.required_date}</strong> | Time: <strong>{req.required_time || 'N/A'}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Contact: <strong>{req.contact_number}</strong></span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-550 pt-1">
                        <span>Units Needed: <strong className="text-red-600 font-bold">{req.blood_units_needed}</strong></span>
                        <span>Emergency: <strong className="text-red-655 uppercase">{req.emergency_level}</strong></span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {(!activeRequest) ? (
                          <>
                            <button
                              onClick={() => handleAcceptRequest(req.id)}
                              disabled={actionLoading}
                              className="btn-primary py-1.5 px-3 text-[11px] font-bold cursor-pointer"
                            >
                              Accept Request
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(req.id)}
                              disabled={actionLoading}
                              className="btn-secondary py-1.5 px-3 text-[11px] font-bold text-slate-500 border-slate-200 cursor-pointer hover:bg-slate-100"
                            >
                              Decline Request
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              disabled={true}
                              className="btn-secondary py-1.5 px-3 text-[11px] font-bold text-slate-400 border-slate-200 opacity-60 cursor-not-allowed"
                            >
                              Accept Request
                            </button>
                            <button
                              disabled={true}
                              className="btn-secondary py-1.5 px-3 text-[11px] font-bold text-slate-400 border-slate-200 opacity-60 cursor-not-allowed"
                            >
                              Decline Request
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleCallPatient(req)}
                          disabled={actionLoading}
                          className="btn-secondary py-1.5 px-3 text-[11px] font-bold text-red-655 border-red-100 cursor-pointer hover:bg-red-50 flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-red-500 fill-red-500" /> Call Patient
                        </button>
                        <button
                          onClick={() => handleMessagePatient(req)}
                          disabled={actionLoading}
                          className="btn-secondary py-1.5 px-3 text-[11px] font-bold text-indigo-650 border-indigo-100 cursor-pointer hover:bg-indigo-50 flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Message Patient
                        </button>
                      </div>
                    </div>

                    <div className="flex shrink-0">
                      <span className="text-xl font-black text-red-600 bg-red-50 border border-red-100 py-2.5 px-4.5 rounded-full">
                        {req.blood_group_required}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Compatible requests feed */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-50 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-850 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-red-500 fill-red-100" /> Nearby Approved Requests
                </h3>
                <p className="text-xs text-slate-450 mt-1">Approved blood requests matching blood type and search radius</p>
              </div>
            </div>

            {loadingFeeds ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              </div>
            ) : nearbyRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-1.5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Heart className="w-10 h-10 text-slate-300" />
                <span className="text-xs font-bold">No nearby requests active</span>
                <p className="text-[10px] text-slate-450 max-w-[250px] font-semibold leading-relaxed mt-0.5">
                  You are all caught up! Approved requests will appear here once matched.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {nearbyRequests.map((req) => (
                  <div key={req.id} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-50/20 transition-colors rounded-xl px-2">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-800">{req.patient_name}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          req.emergency_level === 'Urgent' ? 'bg-amber-100 text-amber-800' : 'bg-slate-150 text-slate-655'
                        }`}>
                          {req.emergency_level}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600 font-medium">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Hospital: <strong>{req.hospital_name} {req.hospital_location ? `- ${req.hospital_location}` : ''}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Location: <strong>{req.district}, {req.division}</strong> ({req.distance !== undefined ? `${req.distance} km` : 'N/A'})</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Date: <strong>{req.required_date}</strong> | Time: <strong>{req.required_time || 'N/A'}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Contact: <strong>{req.contact_number}</strong></span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-550 pt-1">
                        <span>Units Needed: <strong className="text-red-600 font-bold">{req.blood_units_needed}</strong></span>
                        <span>Emergency: <strong className={`${req.emergency_level === 'Urgent' ? 'text-amber-600' : 'text-slate-500'} uppercase`}>{req.emergency_level}</strong></span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {(!activeRequest) ? (
                          <>
                            <button
                              onClick={() => handleAcceptRequest(req.id)}
                              disabled={actionLoading}
                              className="btn-primary py-1.5 px-3 text-[11px] font-bold cursor-pointer"
                            >
                              Accept Request
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(req.id)}
                              disabled={actionLoading}
                              className="btn-secondary py-1.5 px-3 text-[11px] font-bold text-slate-500 border-slate-200 cursor-pointer hover:bg-slate-100"
                            >
                              Decline Request
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              disabled={true}
                              className="btn-secondary py-1.5 px-3 text-[11px] font-bold text-slate-400 border-slate-200 opacity-60 cursor-not-allowed"
                            >
                              Accept Request
                            </button>
                            <button
                              disabled={true}
                              className="btn-secondary py-1.5 px-3 text-[11px] font-bold text-slate-400 border-slate-200 opacity-60 cursor-not-allowed"
                            >
                              Decline Request
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleCallPatient(req)}
                          disabled={actionLoading}
                          className="btn-secondary py-1.5 px-3 text-[11px] font-bold text-red-655 border-red-100 cursor-pointer hover:bg-red-50 flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-red-500 fill-red-500" /> Call Patient
                        </button>
                        <button
                          onClick={() => handleMessagePatient(req)}
                          disabled={actionLoading}
                          className="btn-secondary py-1.5 px-3 text-[11px] font-bold text-indigo-650 border-indigo-100 cursor-pointer hover:bg-indigo-50 flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Message Patient
                        </button>
                      </div>
                    </div>

                    <div className="flex shrink-0">
                      <span className="text-xl font-black text-red-600 bg-red-50 border border-red-100 py-2.5 px-4.5 rounded-full">
                        {req.blood_group_required}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Donation parameters update */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="border-b border-slate-50 pb-3">
              <h2 className="text-base font-extrabold text-slate-800">Update Availability Settings</h2>
              <p className="text-[10px] text-slate-450 mt-1">Keep coordinates and eligibility synced for matching updates</p>
            </div>

            {lastDonationDate && !isEligibleNow(lastDonationDate) && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-850 text-[11px] leading-relaxed flex gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Recovery Window active. Unavailability warnings trigger on matching lists.
                </span>
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Mark Donation Availability</label>
                <select
                  value={availability ? 'true' : 'false'}
                  onChange={(e) => setAvailability(e.target.value === 'true')}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
                >
                  <option value="true">Available (Visible to matching alerts)</option>
                  <option value="false">Unavailable / Offline</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Last Blood Donation Date</label>
                <input
                  type="date"
                  value={lastDonationDate}
                  onChange={(e) => setLastDonationDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Service Division</label>
                <select
                  value={division}
                  onChange={handleDivisionChange}
                  required
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
                >
                  <option value="">Select Division</option>
                  {Object.keys(DIVISION_DISTRICTS).map((div) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Service District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                  disabled={!division}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">Select District</option>
                  {division && DIVISION_DISTRICTS[division].map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Specific Area / Upazila</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Uttara Sector 4"
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary bg-red-500 hover:bg-red-600 text-xs py-2.5 rounded-xl cursor-pointer"
                >
                  {isSubmitting ? "Updating..." : "Update Profile Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Chat modal overlay */}
      {activeRequest && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          requestId={activeRequest.id}
          opponentId={activeRequest.patient_id}
          opponentName={activeRequest.patient_name}
        />
      )}
    </div>
  );
}
