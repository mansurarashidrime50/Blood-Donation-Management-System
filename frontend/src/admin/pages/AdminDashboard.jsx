import React, { useEffect, useState } from 'react';
import { 
  Users, Heart, Award, Activity, Loader2, AlertCircle, Sparkles, 
  MapPin, CheckCircle, Clock, Zap
} from 'lucide-react';
import adminService from '../services/adminService';
import Loader from '../../shared/components/Loader';
import ErrorComponent from '../../shared/components/ErrorComponent';
import Toast from '../../shared/components/Toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [triggeringEscalation, setTriggeringEscalation] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getStats();
      setStats(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve system statistics. Please verify backend status.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunEscalation = async () => {
    setTriggeringEscalation(true);
    try {
      const response = await adminService.runEscalation();
      setToast({ type: 'success', message: response.data.message || "Radius escalation process ran successfully!" });
      fetchStats();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: "Failed to trigger radius escalation checker." });
    } finally {
      setTriggeringEscalation(false);
    }
  };

  if (loading && !stats) return <Loader text="Assembling administrative metrics..." />;
  if (error) return <ErrorComponent message={error} onRetry={fetchStats} />;
  if (!stats) return null;

  const cardItems = [
    { title: 'Total Accounts', value: stats.total_users, desc: 'Registered user profiles', icon: Users, color: 'bg-indigo-50 text-indigo-650' },
    { title: 'Registered Donors', value: stats.total_donors, desc: `Verified: ${stats.verified_donors}`, icon: Heart, color: 'bg-red-50 text-red-650' },
    { title: 'Available Donors', value: stats.available_donors, desc: 'Active & eligible to donate', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-650' },
    { title: 'Blood Requests', value: stats.total_requests, desc: `Accepted: ${stats.accepted_requests}`, icon: Award, color: 'bg-amber-50 text-amber-650' }
  ];

  const requestBreakdown = [
    { label: 'Pending Approval', count: stats.pending_requests, color: 'bg-amber-500' },
    { label: 'Approved & Matching', count: stats.approved_requests, color: 'bg-sky-500' },
    { label: 'Accepted by Donor', count: stats.accepted_requests, color: 'bg-indigo-500' },
    { label: 'Completed Donations', count: stats.completed_donations, color: 'bg-emerald-500' },
    { label: 'Rejected / Cancelled', count: stats.rejected_requests, color: 'bg-slate-400' }
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-8 animate-slide-up text-left max-w-6xl mx-auto pb-12">
      {toast && (
        <div className="fixed top-4 right-4 z-50 min-w-[320px]">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Dashboard Overview</h1>
          <p className="text-sm text-slate-500 font-semibold mt-0.5">Real-time indicators, supply/demand mapping, and automated escalation controls</p>
        </div>
        
        {/* Step 13 manual trigger */}
        <button
          onClick={handleRunEscalation}
          disabled={triggeringEscalation}
          className="btn-primary py-2.5 px-5 text-xs bg-slate-900 hover:bg-slate-850 flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          {triggeringEscalation ? "Running Escalation Checker..." : "Trigger Radius Escalation"}
        </button>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.title}</span>
                  <div className="text-2xl font-extrabold text-slate-800">{item.value}</div>
                  <span className="text-[10px] text-slate-450 font-bold">{item.desc}</span>
                </div>
                <div className={`p-3 rounded-xl ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown Panel */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm lg:col-span-1 space-y-6">
          <h3 className="text-base font-bold text-slate-800">Requests Breakdown</h3>
          <div className="space-y-4">
            {requestBreakdown.map((item, idx) => {
              const percentage = stats.total_requests > 0 
                ? Math.round((item.count / stats.total_requests) * 100) 
                : 0;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-slate-800">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-500`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blood Supply vs Demand Panel */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-slate-800">Blood Types Supply vs Demand</h3>
          <p className="text-xs text-slate-400 font-semibold mt-[-8px]">Compares verified active donors supply (red) vs patient requests demand (gray)</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {bloodGroups.map((bg) => {
              const supplyCount = stats.supply_by_blood_group[bg] || 0;
              const demandCount = stats.demand_by_blood_group[bg] || 0;
              const maxVal = Math.max(...Object.values(stats.supply_by_blood_group), ...Object.values(stats.demand_by_blood_group), 1);
              
              const supplyHeight = `${(supplyCount / maxVal) * 100}%`;
              const demandHeight = `${(demandCount / maxVal) * 100}%`;

              return (
                <div key={bg} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between items-center h-44">
                  <span className="text-sm font-black text-slate-700">{bg}</span>
                  
                  {/* Miniature graph columns */}
                  <div className="flex items-end justify-center gap-3 w-full h-24">
                    <div className="w-3 bg-red-500 rounded-t-sm relative group" style={{ height: supplyHeight }}>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold rounded py-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">
                        Donors: {supplyCount}
                      </div>
                    </div>
                    <div className="w-3 bg-slate-350 rounded-t-sm relative group" style={{ height: demandHeight }}>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold rounded py-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">
                        Requests: {demandCount}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between w-full text-[9px] font-bold text-slate-450 px-1 border-t border-slate-200 pt-1.5 mt-1">
                    <span>Supply: {supplyCount}</span>
                    <span>Demand: {demandCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Activity logs */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800">Recent Request Activity Logs</h3>
        <div className="divide-y divide-slate-50">
          {stats.recent_activities && stats.recent_activities.length > 0 ? (
            stats.recent_activities.map((act, idx) => (
              <div key={idx} className="py-3 flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-700">{act.message}</span>
                <span className="text-slate-400 font-bold">{new Date(act.time).toLocaleTimeString()}</span>
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic font-semibold">No recent logs recorded.</span>
          )}
        </div>
      </div>

    </div>
  );
}
