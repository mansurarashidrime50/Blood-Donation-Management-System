import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, Menu, X, LogOut, User as UserIcon, Settings, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'DONOR') return '/donor/dashboard';
    if (user.role === 'PATIENT') return '/patient/dashboard';
    return '/';
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Droplet className="w-6 h-6 text-red-600 fill-red-600 animate-pulse" />
              </div>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight">
                শেষ আশা <span className="text-red-600">Blood Link</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="text-sm font-semibold text-slate-650 hover:text-red-600 transition-colors"
                >
                  Dashboard
                </Link>
                {user.role === 'DONOR' && (
                  <Link
                    to="/donor/history"
                    className="text-sm font-semibold text-slate-655 hover:text-red-600 transition-colors"
                  >
                    Donation History
                  </Link>
                )}
                {user.role === 'PATIENT' && (
                  <Link
                    to="/patient/search-donors"
                    className="text-sm font-semibold text-slate-655 hover:text-red-600 transition-colors"
                  >
                    Search Donors
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin/users"
                    className="text-sm font-semibold text-slate-655 hover:text-red-600 transition-colors"
                  >
                    Users Manager
                  </Link>
                )}
                
                {/* Profile Widget */}
                <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                  <Link
                    to={user.role === 'ADMIN' ? '/admin/dashboard' : `/${user.role.toLowerCase()}/profile`}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-red-600 transition-colors"
                  >
                    {user.profile_image ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.profile_image}`}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'; }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-[120px] truncate">{user.full_name}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-slate-450 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-bold text-slate-650 hover:text-red-600 transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register/donor"
                  className="btn-primary py-2 px-4 text-sm font-bold shadow-sm"
                >
                  Become a Donor
                </Link>
                <Link
                  to="/register/patient"
                  className="text-sm font-bold text-slate-500 hover:text-slate-700 hover:underline transition-all"
                >
                  Register as Patient
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 focus:outline-none transition-all"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-2 pt-2 pb-4 space-y-1 shadow-inner animate-slide-up">
          {user ? (
            <>
              <Link
                to={getDashboardLink()}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-600"
              >
                Dashboard
              </Link>
              {user.role === 'DONOR' && (
                <Link
                  to="/donor/history"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-600"
                >
                  Donation History
                </Link>
              )}
              {user.role === 'PATIENT' && (
                <Link
                  to="/patient/search-donors"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-600"
                >
                  Search Donors
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin/users"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-600"
                >
                  Users Manager
                </Link>
              )}
              
              <div className="border-t border-slate-150 mt-4 pt-4 px-3 flex items-center justify-between">
                <Link
                  to={user.role === 'ADMIN' ? '/admin/dashboard' : `/${user.role.toLowerCase()}/profile`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3"
                >
                  {user.profile_image ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.profile_image}`}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-800 text-sm leading-tight">{user.full_name}</div>
                    <div className="text-xs text-slate-450 mt-0.5">{user.role}</div>
                  </div>
                </Link>
                <button
                  onClick={() => { setIsOpen(false); handleLogout(); }}
                  className="p-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                Log In
              </Link>
              <Link
                to="/register/donor"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-semibold text-red-600 bg-red-50 hover:bg-red-100"
              >
                Become a Donor
              </Link>
              <Link
                to="/register/patient"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-600 bg-slate-50"
              >
                Register as Patient
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
