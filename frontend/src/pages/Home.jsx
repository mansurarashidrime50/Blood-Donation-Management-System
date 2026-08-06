import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Droplet, Search, Heart, Shield, Users, ArrowRight, Activity, Calendar, 
  HelpCircle, PhoneCall, HeartHandshake, CheckCircle2, ChevronRight, Award, Compass, MapPin 
} from 'lucide-react';
import { useAuth } from '../shared/context/AuthContext';
import client from '../shared/api/client';
import Button from '../shared/components/Button';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quickBlood, setQuickBlood] = useState('');
  const [quickDivision, setQuickDivision] = useState('');
  
  // Public stats state
  const [stats, setStats] = useState({
    total_donors: 0,
    active_requests: 0,
    requests_by_group: {},
    donors_by_group: {},
    recent_requests: []
  });
  
  const [roleMode, setRoleMode] = useState('donor'); // 'donor' or 'patient'

  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const response = await client.get('/public-stats');
        setStats(response.data);
      } catch (err) {
        console.error("Failed to load public statistics:", err);
      }
    };
    fetchPublicStats();
  }, []);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    const params = new URLSearchParams();
    if (quickBlood) params.append('blood_group', quickBlood);
    if (quickDivision) params.append('division', quickDivision);
    navigate(`/patient/search-donors?${params.toString()}`);
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const divisions = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white py-16 lg:py-24">
        {/* Decorative background glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#ef444415,transparent_50%)]" />
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-current animate-pulse text-red-500" />
              শেষ আশা - Blood Link
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              Connecting <span className="text-red-500">Life-Saving</span> Blood Donors with Recipients
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              A unified emergency blood locator platform bridging the gap between recipients and voluntary donors across Bangladesh. Register, check donor availability, or create requests instantly.
            </p>

            {/* Public Statistics Quick Info */}
            <div className="grid grid-cols-2 gap-4 max-w-sm bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40 backdrop-blur-sm">
              <div className="text-center sm:text-left border-r border-slate-700/60 pr-4">
                <div className="text-xl sm:text-3xl font-black text-red-500">{stats.active_requests}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Active Requests</div>
              </div>
              <div className="text-center sm:text-left pl-4">
                <div className="text-xl sm:text-3xl font-black text-emerald-500">{stats.total_donors}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Registered Donors</div>
              </div>
            </div>

            {/* Action for Logged In Users */}
            {user && (
              <div className="pt-2">
                <Link 
                  to={user.role === 'ADMIN' ? '/admin/dashboard' : `/${user.role.toLowerCase()}/dashboard`} 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-650 hover:bg-red-750 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-red-900/30"
                >
                  Go to your Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>

          {/* Hero Right Widget (Interactive Live Feed / Quick Search) */}
          <div className="lg:col-span-5 animate-slide-up [animation-delay:200ms]">
            
            {/* Interactive Toggle for Guest Mode */}
            {!user && (
              <div className="flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 max-w-xs mb-3 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setRoleMode('donor')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                    roleMode === 'donor' ? 'bg-red-650 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Donor View
                </button>
                <button
                  type="button"
                  onClick={() => setRoleMode('patient')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                    roleMode === 'patient' ? 'bg-slate-750 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Recipient View
                </button>
              </div>
            )}

            {user || roleMode === 'patient' ? (
              /* Donor Search Registry Widget */
              <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 text-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2">
                    <Search className="w-5 h-5 text-red-600" />
                    Quick Search Registry
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                    {stats.total_donors} Active
                  </span>
                </div>
                
                {stats.donors_by_group && Object.keys(stats.donors_by_group).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Available Donors</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(stats.donors_by_group).slice(0, 4).map(([bg, count]) => (
                        <span key={bg} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-150 text-slate-600 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {bg}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleQuickSearch} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Blood Group Needed
                      </label>
                      <select
                        value={quickBlood}
                        onChange={(e) => setQuickBlood(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
                      >
                        <option value="">Any Blood Group</option>
                        {bloodGroups.map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Division
                      </label>
                      <select
                        value={quickDivision}
                        onChange={(e) => setQuickDivision(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
                      >
                        <option value="">Any Division</option>
                        {divisions.map((div) => (
                          <option key={div} value={div}>{div}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    icon={Search}
                  >
                    Search Registry
                  </Button>
                </form>
              </div>
            ) : (
              /* Live Requests Feed Widget */
              <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-3xl shadow-2xl backdrop-blur-md text-white space-y-5 text-left">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <h3 className="text-base font-extrabold flex items-center gap-2 text-red-400">
                    <Activity className="w-5 h-5 animate-pulse text-red-500" />
                    Live Blood Requests ({stats.active_requests})
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>

                {stats.requests_by_group && Object.keys(stats.requests_by_group).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Breakdown</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(stats.requests_by_group).map(([bg, count]) => (
                        <span key={bg} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-red-950/40 border border-red-900/50 text-red-300 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {bg}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {stats.recent_requests && stats.recent_requests.length > 0 ? (
                    stats.recent_requests.map((req) => (
                      <div key={req.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all duration-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 truncate max-w-[130px]">{req.hospital_name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                            req.emergency_level === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            req.emergency_level === 'Urgent' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {req.emergency_level}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-red-650 flex items-center justify-center text-xs font-black text-white">
                              {req.blood_group_required}
                            </span>
                            <div>
                              <div className="text-[11px] font-bold text-slate-200">{req.blood_units_needed} Unit(s) Needed</div>
                              <div className="text-[9px] text-slate-400">{req.division}, {req.district}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] text-slate-400 uppercase font-bold">Needed by</div>
                            <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1 justify-end">
                              <Calendar className="w-3 h-3 text-slate-450" />
                              {new Date(req.required_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-450 text-xs font-medium bg-slate-900/40 rounded-2xl border border-slate-800">
                      No active blood requests currently.
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <Link to="/donor/login" className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 border border-slate-700/80 hover:border-red-500/50 rounded-xl text-[11px] font-bold transition-all text-slate-300 hover:text-white">
                    View All Requests / Respond
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Three Large Portal Gateway Cards */}
      {!user && (
        <section className="py-16 max-w-7xl mx-auto px-4 w-full">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-extrabold tracking-widest text-red-650 uppercase">Gateway Access</span>
            <h2 className="text-3xl font-extrabold text-slate-855 tracking-tight">Select your platform role</h2>
            <p className="text-sm text-slate-500 leading-relaxed font-semibold">
              Please enter through the appropriate portal below to manage your custom workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Donor Portal */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 hover:shadow-xl hover:border-red-500/35 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-red-655 mb-6 group-hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7 fill-red-500 text-red-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-850 mb-3">Donor Portal</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Log in as a voluntary blood donor. Toggle your availability, review compatible emergency patient requests, and manage your donation logs.
                </p>
              </div>
              <div className="space-y-3">
                <Link to="/donor/login" className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-red-650 hover:bg-red-750 text-white font-bold rounded-xl transition-all shadow-md">
                  Login as Donor
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-center text-xs text-slate-450 font-bold">
                  New donor? <Link to="/register/donor" className="text-red-650 hover:underline">Register</Link>
                </div>
              </div>
            </div>

            {/* Card 2: Patient Portal */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 hover:shadow-xl hover:border-slate-500/35 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-850 mb-3">Patient Portal</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Log in to post emergency blood requests, verify donor responses, and browse matched nearby donors.
                </p>
              </div>
              <div className="space-y-3">
                <Link to="/patient/login" className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-md">
                  Login as Patient
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-center text-xs text-slate-450 font-bold">
                  Need blood? <Link to="/register/patient" className="text-slate-800 hover:underline">Create Account</Link>
                </div>
              </div>
            </div>

            {/* Card 3: Admin Portal */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 hover:shadow-xl hover:border-indigo-500/35 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-650 mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-855 mb-3">Admin Portal</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Log in to audit blood requests, review platform statistics, manage users, verify blood donations, and configure platform parameters.
                </p>
              </div>
              <div className="space-y-3">
                <Link to="/admin/login" className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all border border-slate-200">
                  Login as Admin
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-center text-xs text-slate-400 font-medium">
                  Authorized system administrators only
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* 3. About Section */}
      <section className="py-20 bg-white w-full border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs font-extrabold tracking-widest text-red-650 uppercase">Every Drop Counts</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-850 tracking-tight leading-tight">
                Empowering communities with localized match systems
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Our Blood Donation Management System is built to automate the match-finding workflow. When a patient posts an approved request, the platform maps matching donors within the exact division, sending real-time logs and updates.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Secure Direct Matchmaking</h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      We protect donor credentials by only sharing contact info when matches are explicitly confirmed.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-center shrink-0 border border-emerald-100">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Local Notifications Mapping</h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      Filtered alerts allow donors to respond quickly to critical emergencies within their own division.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Grid Column */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 space-y-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-850 text-sm">Save Up to 3 Lives</h4>
                <p className="text-xs text-slate-450 leading-relaxed">
                  One blood unit can be separated into red cells, platelets, and plasma to help multiple patients.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 space-y-3 text-left mt-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-505 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-855 text-sm">Real-time Location</h4>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Filter matches down to specific divisions and districts for rapid emergency transport.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Emergency Banner */}
      <section className="w-full bg-gradient-to-r from-red-655 to-rose-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <h3 className="text-2xl font-black flex items-center justify-center md:justify-start gap-2">
              <PhoneCall className="w-6 h-6 animate-bounce" />
              Emergency Blood Request
            </h3>
            <p className="text-red-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              If you or someone you know requires blood immediately, please click below to create a patient request. Matching donors will be alert-logged in real-time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link 
              to={user ? (user.role === 'PATIENT' ? '/patient/requests/create' : '/donor/dashboard') : '/register/patient'} 
              className="px-5 py-3 bg-white text-red-650 font-extrabold rounded-xl text-xs hover:bg-slate-50 transition-colors uppercase tracking-wider"
            >
              Request Blood Now
            </Link>
            <a 
              href="tel:+88012345678" 
              className="px-5 py-3 bg-red-800 text-white border border-red-500/50 hover:bg-red-900 font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              Call Hotline: +880 1234 5678
            </a>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Droplet className="w-8 h-8 text-red-500 fill-red-500" />
              <span className="text-lg font-black uppercase tracking-wider">শেষ আশা - Blood Link</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              An advanced, security-first healthcare registry for emergency blood matchmaking across Bangladesh. Save lives locally.
            </p>
            <div className="text-xs text-slate-600 font-semibold pt-1">
              &copy; {new Date().getFullYear()} Blood Link. All rights reserved.
            </div>
          </div>

          {/* Portals Col */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-black uppercase tracking-widest text-slate-300">Access Portals</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/donor/login" className="hover:text-white transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700" /> Donor Portal
                </Link>
              </li>
              <li>
                <Link to="/patient/login" className="hover:text-white transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700" /> Patient Portal
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-white transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700" /> Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Actions Col */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-black uppercase tracking-widest text-slate-300">Register</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/register/donor" className="hover:text-white transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700" /> Register as Donor
                </Link>
              </li>
              <li>
                <Link to="/register/patient" className="hover:text-white transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700" /> Register as Recipient
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700" /> Generic Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-black uppercase tracking-widest text-slate-300">Support Desk</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" /> Dhaka, Bangladesh
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-red-500" /> +880 1234 5678
              </li>
              <li className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-red-500" /> support@bloodlink.org.bd
              </li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
}
