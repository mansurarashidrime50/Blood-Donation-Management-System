import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Award, Clock, CheckCircle, XCircle, ArrowLeft, Heart, User, MapPin, 
  MessageSquare, Phone, Send, Calendar, Check
} from 'lucide-react';
import patientService from '../services/patientService';
import sharedService from '../../shared/services/sharedService';
import Loader from '../../shared/components/Loader';
import Button from '../../shared/components/Button';
import Toast from '../../shared/components/Toast';
import ChatModal from '../../shared/components/ChatModal';

export default function TrackRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Meeting form fields
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [submittingMeeting, setSubmittingMeeting] = useState(false);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  const fetchRequestDetails = useCallback(async () => {
    setError(null);
    try {
      const reqRes = await patientService.getRequest(id);
      setRequest(reqRes.data);
      
      // Fetch meeting if available
      try {
        const meetingRes = await patientService.getRequestMeeting(id);
        if (meetingRes.data) {
          setMeeting(meetingRes.data);
          // Pre-populate fields
          setMeetingTime(meetingRes.data.meeting_time.substring(0, 16));
          setMeetingLocation(meetingRes.data.meeting_location);
        }
      } catch (meetErr) {
        console.error("Meeting not found", meetErr);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch blood request details.");
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRequestDetails();
      setLoading(false);
    };
    init();
    
    // Poll updates every 8s
    const interval = setInterval(fetchRequestDetails, 8000);
    return () => clearInterval(interval);
  }, [id, fetchRequestDetails]);

  const handleProposeMeeting = async (e) => {
    e.preventDefault();
    if (!meetingTime || !meetingLocation) return;
    
    setSubmittingMeeting(true);
    try {
      const response = await patientService.proposeMeeting(id, {
        request_id: parseInt(id),
        meeting_time: new Date(meetingTime).toISOString(),
        meeting_location: meetingLocation
      });
      setMeeting(response.data);
      setToast({ type: 'success', message: "Meeting details proposed successfully! Wait for donor confirmation." });
      await fetchRequestDetails();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to propose meeting details." });
    } finally {
      setSubmittingMeeting(false);
    }
  };

  const handleConfirmReceived = async () => {
    setSubmittingCompletion(true);
    try {
      const updated = await patientService.confirmBloodReceived(id);
      setRequest(updated.data);
      setToast({ type: 'success', message: "Blood received confirmation recorded. Waiting for Admin verification." });
      await fetchRequestDetails();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to submit receipt confirmation." });
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const handleCallDonorLog = async () => {
    if (!request || !request.accepted_donor) return;
    try {
      await sharedService.logCall({
        caller_id: request.patient_id,
        receiver_id: request.accepted_donor_id,
        request_id: request.id,
        call_type: "CALL_DONOR",
        status: "Completed"
      });
    } catch (err) {
      console.error("Failed to log call", err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-amber-100 text-amber-800 border-amber-200',
      Approved: 'bg-sky-100 text-sky-800 border-sky-200',
      Matching: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      Notified: 'bg-purple-100 text-purple-800 border-purple-200',
      Accepted: 'bg-rose-100 text-rose-800 border-rose-200',
      Confirmed: 'bg-teal-100 text-teal-800 border-teal-200',
      "Waiting Verification": 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getWorkflowStep = () => {
    const statusMap = {
      Pending: 1,
      Approved: 2,
      Matching: 2,
      Notified: 2,
      Accepted: 3,
      Confirmed: 4,
      "Donation Completed": 5,
      "Waiting Verification": 5,
      Completed: 6
    };
    return statusMap[request.request_status] || 1;
  };

  if (loading && !request) return <Loader text="Synchronizing status trackers..." />;
  if (error) return <div className="text-red-500 text-center py-12 font-bold">{error}</div>;
  if (!request) return null;

  const currentStep = getWorkflowStep();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-slide-up pb-12">
      {toast && (
        <div className="fixed top-4 right-4 z-50 min-w-[320px]">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/patient/dashboard')}
          className="p-2.5 bg-white rounded-xl border border-slate-150 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-slate-650" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Track Request</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Real-time matching status, direct coordination, and donor profile oversight</p>
        </div>
      </div>

      {/* Workflow Step Indicator */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Donation Progress</span>
          <span className={`text-xs font-extrabold border px-3 py-1 rounded-full ${getStatusColor(request.request_status)}`}>
            Status: {request.request_status}
          </span>
        </div>
        
        {/* Step dots */}
        <div className="relative flex flex-col md:flex-row justify-between items-center gap-6 md:gap-2">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[15px] left-8 right-8 h-1 bg-slate-100 z-0">
            <div 
              className="h-full bg-red-500 transition-all duration-500" 
              style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
            />
          </div>

          {[
            { step: 1, title: "Requested", desc: "Patient posted" },
            { step: 2, title: "Approved", desc: "Admin review" },
            { step: 3, title: "Accepted", desc: "Donor matched" },
            { step: 4, title: "Confirmed", desc: "Meeting scheduled" },
            { step: 5, title: "Completed", desc: "Donated" },
            { step: 6, title: "Verified", desc: "Database synced" }
          ].map((item) => {
            const isCompleted = currentStep >= item.step;
            const isActive = currentStep === item.step;
            return (
              <div key={item.step} className="flex md:flex-col items-center gap-3 md:text-center z-10 w-full md:w-auto">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                  isCompleted 
                    ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/10' 
                    : 'bg-white border-slate-200 text-slate-400'
                } ${isActive ? 'ring-4 ring-red-100 scale-105' : ''}`}>
                  {isCompleted && item.step < currentStep ? <Check className="w-4 h-4" /> : item.step}
                </div>
                <div className="flex flex-col md:items-center">
                  <span className={`text-xs font-bold ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{item.title}</span>
                  <span className="text-[10px] text-slate-450 font-semibold">{item.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Request Details & Verification actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Request Meta Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-800">For Patient: {request.patient_name}</h3>
                <span className="text-xs font-semibold text-slate-450 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {request.hospital_name}
                </span>
                {request.hospital_location && (
                  <p className="text-[11px] font-semibold text-slate-500 pl-4.5 mt-0.5">{request.hospital_location}</p>
                )}
              </div>
              <span className="text-lg font-black text-red-600 bg-red-50 py-1.5 px-4 rounded-full border border-red-150">
                {request.blood_group_required}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
              <div>
                <div className="font-bold text-slate-400 uppercase mb-0.5">Units Required</div>
                <span className="text-sm font-bold text-slate-800">{request.blood_units_needed} Units</span>
              </div>
              <div>
                <div className="font-bold text-slate-400 uppercase mb-0.5">Required Date</div>
                <span className="text-sm font-bold text-slate-800">{request.required_date}</span>
              </div>
              <div>
                <div className="font-bold text-slate-400 uppercase mb-0.5">Required Time</div>
                <span className="text-sm font-bold text-slate-800">{request.required_time || "Not specified"}</span>
              </div>
              <div>
                <div className="font-bold text-slate-400 uppercase mb-0.5">Emergency Level</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-0.5 font-bold ${
                  request.emergency_level === 'Critical' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                }`}>{request.emergency_level}</span>
              </div>
            </div>

            {request.additional_notes && (
              <div className="border-t border-slate-50 pt-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Additional Notes</span>
                <p className="text-xs font-semibold text-slate-600 mt-1">{request.additional_notes}</p>
              </div>
            )}
          </div>

          {/* Step 8 & 9: Meeting Scheduler (Only visible if Donor accepted) */}
          {request.request_status !== 'Pending' && request.request_status !== 'Approved' && request.request_status !== 'Matching' && request.request_status !== 'Notified' && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" /> Propose / Edit Meeting Details
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-[-8px]">
                Suggest a specific time and medical center/bed coordinates for donor confirmation.
              </p>

              <form onSubmit={handleProposeMeeting} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Meeting Time</label>
                  <input
                    type="datetime-local"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    required
                    className="input-field py-2.5 font-semibold text-xs text-slate-800"
                    disabled={request.request_status === 'Completed' || request.request_status === 'Waiting Verification'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Meeting Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Evercare Ward 3, Bed 12"
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    required
                    className="input-field py-2.5 font-semibold text-xs"
                    disabled={request.request_status === 'Completed' || request.request_status === 'Waiting Verification'}
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  {request.request_status !== 'Completed' && request.request_status !== 'Waiting Verification' && (
                    <button
                      type="submit"
                      disabled={submittingMeeting}
                      className="btn-primary py-2.5 text-xs px-4"
                    >
                      {submittingMeeting ? "Submitting..." : meeting ? "Update Meeting Details" : "Propose Meeting"}
                    </button>
                  )}
                </div>
              </form>

              {meeting && (
                <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Meeting Status</span>
                    <p className="text-xs font-bold text-slate-700">
                      {meeting.status === 'Confirmed' ? '✅ Confirmed by Donor' : '⏳ Awaiting Donor Confirmation'}
                    </p>
                  </div>
                  
                  {/* Step 9 Receipt Confirmation Button */}
                  {meeting.status === 'Confirmed' && request.request_status !== 'Completed' && request.request_status !== 'Waiting Verification' && (
                    <button
                      onClick={handleConfirmReceived}
                      disabled={submittingCompletion}
                      className="btn-primary bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" /> Confirm Blood Received
                    </button>
                  )}
                  {request.request_status === 'Waiting Verification' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-150 rounded-xl text-yellow-800 text-xs font-semibold">
                      ⌛ Donation awaiting Admin verification check.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* History transitions log */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800">Request Transitions Log</h3>
            <div className="relative border-l-2 border-slate-100 pl-6 ml-2 space-y-5">
              {request.histories.length === 0 ? (
                <span className="text-xs text-slate-450 italic font-semibold">No logs recorded.</span>
              ) : (
                request.histories.map((hist) => (
                  <div key={hist.id} className="relative">
                    <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-100" />
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">State: {hist.status}</span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(hist.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5 leading-normal">
                        {hist.notes || `Advanced to ${hist.status}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Accepted Donor details & links */}
        <div className="lg:col-span-1 space-y-6">
          {request.accepted_donor_id ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Accepted Donor Profile</span>
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 font-bold text-xl flex items-center justify-center mx-auto shadow-inner mb-3">
                  {request.accepted_donor?.full_name?.charAt(0).toUpperCase()}
                </div>
                <h4 className="font-extrabold text-slate-800 text-base">{request.accepted_donor?.full_name}</h4>
                <span className="text-xs font-black text-red-600 bg-red-50/50 border border-red-100 py-0.5 px-3 rounded-full mt-1.5 inline-block">
                  Blood Group: {request.accepted_donor?.blood_group}
                </span>
              </div>

              {/* Donor Proximity Specs */}
              <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-4 text-xs font-semibold text-slate-655">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Distance</span>
                  <span>{request.distance || '12.4'} km</span>
                </div>
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Estimated ETA</span>
                  <span>25 mins</span>
                </div>
              </div>

              {/* Direct Actions toolbar */}
              <div className="space-y-3">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="w-full flex items-center justify-center gap-2 btn-primary bg-slate-900 hover:bg-slate-850 text-xs py-2.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" /> Live Website Chat
                </button>
                <a
                  href={`https://wa.me/${request.accepted_donor?.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 btn-secondary hover:bg-emerald-50 text-xs py-2.5 text-emerald-600 border-emerald-100 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-emerald-500 fill-emerald-500" /> WhatsApp Direct
                </a>
                <a
                  href={`tel:${request.accepted_donor?.phone}`}
                  onClick={handleCallDonorLog}
                  className="w-full flex items-center justify-center gap-2 btn-secondary hover:bg-red-50 text-xs py-2.5 text-red-600 border-red-100 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-red-500 fill-red-500 animate-bounce" /> Call Phone ({request.accepted_donor?.phone})
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-center py-10 space-y-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Searching for matching donors...</h4>
                <p className="text-[11px] text-slate-400 font-semibold mt-1 max-w-[200px] mx-auto leading-normal">
                  Matching algorithms are running. Eligible donors are being notified. Unread warnings appear in donor feeds.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat modal wrapper */}
      {request.accepted_donor && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          requestId={request.id}
          opponentId={request.accepted_donor_id}
          opponentName={request.accepted_donor.full_name}
        />
      )}
    </div>
  );
}
