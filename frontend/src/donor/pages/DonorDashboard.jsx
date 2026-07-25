import React, { useState, useEffect } from 'react';
import { Heart, Calendar, MapPin, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import Button from '../../shared/components/Button';
import Toast from '../../shared/components/Toast';

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

  // Form states
  const [availability, setAvailability] = useState(user?.availability ?? true);
  const [lastDonationDate, setLastDonationDate] = useState(user?.last_donation_date ?? '');
  const [division, setDivision] = useState(user?.division ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [area, setArea] = useState(user?.area ?? '');

  // Sync form states with auth context user if updated
  useEffect(() => {
    if (user) {
      setAvailability(user.availability);
      setLastDonationDate(user.last_donation_date ?? '');
      setDivision(user.division ?? '');
      setDistrict(user.district ?? '');
      setArea(user.area ?? '');
    }
  }, [user]);

  const handleDivisionChange = (e) => {
    const newDiv = e.target.value;
    setDivision(newDiv);
    setDistrict(''); // Reset district when division changes
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
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to update your donor status parameters." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up text-left max-w-4xl mx-auto">
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
          <p className="text-sm text-slate-500 font-semibold mt-0.5">Configure your active availability status, eligibility dates, and target service area</p>
        </div>
      </div>

      {/* Overview Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${availability ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Availability Status</span>
            <div className={`text-lg font-black ${availability ? 'text-emerald-600' : 'text-slate-500'}`}>
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
            <div className="text-xs font-black text-slate-850 mt-1">
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
            <div className="text-xs font-black text-slate-850 mt-1 truncate max-w-[180px]">
              {area ? `${area}, ` : ''}{district ? `${district}` : 'Not Specified'}
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-extrabold text-slate-850">Update Donation Status & Parameters</h2>
          <p className="text-xs text-slate-450 mt-1">
            Keep your donation details updated to ensure local patient blood requests can reach you accurately.
          </p>
        </div>

        {/* Warnings for donation interval */}
        {lastDonationDate && !isEligibleNow(lastDonationDate) && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-850 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">
              Based on your last donation date (<strong>{lastDonationDate}</strong>), you are currently in the standard 90-day recovery window. Please make sure to update your availability once you are fully eligible.
            </span>
          </div>
        )}

        <form onSubmit={handleStatusSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Availability Toggle options */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mark Donation Availability</label>
              <select
                value={availability ? 'true' : 'false'}
                onChange={(e) => setAvailability(e.target.value === 'true')}
                className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
              >
                <option value="true">Available (Visible to Patients & matching alerts)</option>
                <option value="false">Unavailable / Offline (Hidden from emergency donor searches)</option>
              </select>
            </div>

            {/* Last Donation Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Last Blood Donation Date</label>
              <input
                type="date"
                value={lastDonationDate}
                onChange={(e) => setLastDonationDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
              />
            </div>

            {/* Target Division */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Division</label>
              <select
                value={division}
                onChange={handleDivisionChange}
                required
                className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
              >
                <option value="">Select Division</option>
                {Object.keys(DIVISION_DISTRICTS).map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            {/* Target District */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Service District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                disabled={!division}
                className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Select District</option>
                {division && DIVISION_DISTRICTS[division].map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>

            {/* Specific Service Area */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Specific Area / Upazila</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Uttara Sector 4, Mirpur 10, etc."
                className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={isSubmitting}
            >
              Update Donation Profile
            </Button>
          </div>

        </form>
      </div>

    </div>
  );
}
