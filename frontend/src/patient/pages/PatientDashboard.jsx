import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Edit2, Trash2, Heart, Activity, CheckCircle, Info, Users, Phone, MapPin, Search } from 'lucide-react';
import patientService from '../services/patientService';
import client from '../../shared/api/client';
import Table from '../../shared/components/Table';
import Pagination from '../../shared/components/Pagination';
import Button from '../../shared/components/Button';
import Toast from '../../shared/components/Toast';
import Loader from '../../shared/components/Loader';
import { useAuth } from '../../shared/context/AuthContext';
import sharedService from '../../shared/services/sharedService';
import ChatModal from '../../shared/components/ChatModal';

export default function PatientDashboard() {
  const { user } = useAuth();
  
  // Requests State
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Available Donors State
  const [donors, setDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [donorsError, setDonorsError] = useState(null);

  const [toast, setToast] = useState(null);

  // Chat overlay state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRequestId, setChatRequestId] = useState(null);
  const [chatOpponentId, setChatOpponentId] = useState(null);
  const [chatOpponentName, setChatOpponentName] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    setRequestsError(null);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await patientService.getRequests({ skip, limit: itemsPerPage });
      setRequests(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error(err);
      setRequestsError("Failed to load your blood requests overview.");
    } finally {
      setLoadingRequests(false);
    }
  }, [currentPage]);

  const fetchAvailableDonors = useCallback(async () => {
    setLoadingDonors(true);
    setDonorsError(null);
    try {
      // Query active available donors
      const response = await client.get('/search/donors', {
        params: { skip: 0, limit: 5, availability: true }
      });
      setDonors(response.data.items);
    } catch (err) {
      console.error(err);
      setDonorsError("Failed to load available donors.");
    } finally {
      setLoadingDonors(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchAvailableDonors();
  }, [fetchAvailableDonors]);

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this blood request?")) return;
    try {
      await patientService.deleteRequest(id);
      setToast({ type: 'success', message: "Blood request successfully deleted." });
      fetchRequests();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to delete the request." });
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      Pending: 'bg-amber-50 text-amber-700 border border-amber-100',
      Approved: 'bg-sky-50 text-sky-700 border border-sky-100',
      Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      Cancelled: 'bg-slate-100 text-slate-500 border border-slate-200',
    };
    return styles[status] || 'bg-slate-50 text-slate-600 border border-slate-100';
  };

  const getStatsCounts = () => {
    const stats = { total: total, pending: 0, completed: 0 };
    requests.forEach(r => {
      if (r.request_status === 'Pending' || r.request_status === 'Approved') stats.pending++;
      if (r.request_status === 'Completed') stats.completed++;
    });
    return stats;
  };

  const stats = getStatsCounts();

  const getActiveMatch = (donorId) => {
    return requests.find(r => r.accepted_donor_id === donorId && ['Accepted', 'Confirmed', 'Donation Completed', 'Waiting Verification'].includes(r.request_status));
  };

  const handleCallDonorLog = async (donorId, requestId) => {
    try {
      await sharedService.logCall({
        caller_id: user.id,
        receiver_id: donorId,
        request_id: requestId || 0,
        call_type: "CALL_DONOR",
        status: "Completed"
      });
    } catch (err) {
      console.error("Failed to log call", err);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up text-left">
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
            Welcome, {user?.full_name || 'Patient'}
            <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider rounded-full border border-slate-200">
              Patient
            </span>
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-0.5">Post blood request demands and find matching donors availability</p>
        </div>
        <Link
          to="/patient/requests/create"
          className="btn-primary py-2.5 px-5 text-sm flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Request Blood
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: My Requests Overview (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Quick Stats Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0">
                <Heart className="w-6 h-6 fill-red-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">My Requests</span>
                <div className="text-xl font-extrabold text-slate-800">{stats.total}</div>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Requests</span>
                <div className="text-xl font-extrabold text-slate-800">{stats.pending}</div>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fulfilled Requests</span>
                <div className="text-xl font-extrabold text-slate-800">{stats.completed}</div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-slate-850">My Blood Requests Feed</h2>
            
            <Table
              headers={['Patient Name', 'Group & Units', 'Required Date', 'Status', 'Actions']}
              data={requests}
              isLoading={loadingRequests}
              emptyMessage="You have not posted any blood requests yet. Click 'Request Blood' to launch one."
              renderRow={(req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-850">{req.patient_name}</div>
                    <div className="text-xs text-slate-400 font-semibold mt-0.5">Hospital: {req.hospital_name}</div>
                    {req.accepted_donor && (
                      <div className="mt-2 p-2 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1.5 max-w-xs">
                        <div className="text-[9px] font-extrabold text-rose-700 uppercase tracking-wider">Accepted Match Donor</div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">{req.accepted_donor.full_name} ({req.accepted_donor.blood_group})</span>
                          <div className="flex gap-1.5">
                            <a
                              href={`tel:${req.accepted_donor.phone}`}
                              onClick={() => handleCallDonorLog(req.accepted_donor.id, req.id)}
                              className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-650"
                              title="Call Donor"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => {
                                setChatRequestId(req.id);
                                setChatOpponentId(req.accepted_donor.id);
                                setChatOpponentName(req.accepted_donor.full_name);
                                setIsChatOpen(true);
                              }}
                              className="p-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold"
                              title="Chat live"
                            >
                              Chat
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-extrabold text-red-600">{req.blood_group_required}</div>
                    <div className="text-xs text-slate-450 mt-0.5">{req.blood_units_needed} Unit(s)</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-600 text-sm">
                    {req.required_date}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusStyle(req.request_status)}`}>
                      {req.request_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/patient/requests/${req.id}/track`}
                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 text-slate-650 hover:bg-slate-200"
                        title="Track Donor Offers"
                      >
                        <Eye className="w-4 h-4" />
                        Track
                      </Link>

                      {req.request_status !== 'Completed' && req.request_status !== 'Cancelled' && (
                        <>
                          <Link
                            to={`/patient/requests/${req.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-650 hover:bg-red-50 transition-all"
                            title="Edit Request"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-650 hover:bg-red-50 transition-all"
                            title="Delete Request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            />

            <Pagination
              currentPage={currentPage}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              isLoading={loadingRequests}
            />
          </div>
        </div>

        {/* Right Column: Donor Availability Registry (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              Active Donors Availability
            </h3>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Voluntary blood donors currently marked active and available to respond. Contact them directly.
          </p>

          <div className="space-y-4">
            {loadingDonors ? (
              <Loader text="Loading available registry..." />
            ) : donorsError ? (
              <div className="text-xs text-rose-500 font-medium">{donorsError}</div>
            ) : donors.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                No active donors currently marked available.
              </div>
            ) : (
              donors.map((donor) => {
                const activeMatch = getActiveMatch(donor.id);
                return (
                  <div key={donor.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/85 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 truncate max-w-[130px]">{donor.full_name}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Available
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-y border-slate-100 py-2 my-1 text-[10px] font-semibold text-slate-500">
                      <div>
                        <div className="text-slate-400 font-bold uppercase text-[8px]">Total Donations</div>
                        <div className="font-extrabold text-slate-700 text-xs mt-0.5">{donor.donor_profile?.total_donations ?? 0} times</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-bold uppercase text-[8px]">Last Donation</div>
                        <div className="font-extrabold text-slate-700 text-xs mt-0.5">{donor.donor_profile?.last_donation_date ?? 'Never'}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-xs font-black text-white shadow-sm shadow-red-200">
                          {donor.blood_group}
                        </span>
                        <div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase">Estimated Proximity</div>
                          <div className="text-xs font-bold text-slate-700">
                            {donor.district} ({donor.estimated_distance ? `${donor.estimated_distance} km` : 'N/A'})
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {activeMatch ? (
                      <div className="flex gap-2 w-full pt-1">
                        <a
                          href={`tel:${donor.phone}`}
                          onClick={() => handleCallDonorLog(donor.id, activeMatch.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-[10px] font-bold text-red-655"
                        >
                          <Phone className="w-3.5 h-3.5 text-red-500" /> Call Donor
                        </a>
                        <button
                          onClick={() => {
                            setChatRequestId(activeMatch.id);
                            setChatOpponentId(donor.id);
                            setChatOpponentName(donor.full_name);
                            setIsChatOpen(true);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-[10px] font-bold text-white"
                        >
                          Chat Live
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 w-full pt-1.5 border-t border-slate-100/50">
                        <span className="text-[9px] text-slate-400 font-bold italic flex items-center gap-1 justify-center">
                          🔒 Communication locked until match acceptance
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled
                            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-400 cursor-not-allowed"
                          >
                            <Phone className="w-3 h-3" /> Call Locked
                          </button>
                          <button
                            disabled
                            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-400 cursor-not-allowed"
                          >
                            Chat Locked
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Link 
              to="/patient/search-donors" 
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold transition-all text-white shadow"
            >
              Search Full Donor Registry
              <Search className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Chat modal overlay */}
      {isChatOpen && chatRequestId && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          requestId={chatRequestId}
          opponentId={chatOpponentId}
          opponentName={chatOpponentName}
        />
      )}
    </div>
  );
}
