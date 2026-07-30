import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Droplet, Menu, X, User, Search, LogOut, LayoutDashboard, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'text-blood-600 bg-blood-50'
        : 'text-slate-600 hover:text-blood-500 hover:bg-slate-50'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
      isActive
        ? 'text-blood-600 bg-blood-50'
        : 'text-slate-600 hover:text-blood-500 hover:bg-slate-50'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-blood-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Droplet className="w-6 h-6 text-blood-500 fill-blood-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-lg tracking-tight text-slate-800 leading-none group-hover:text-blood-600 transition-colors">
                  শেষ আশা
                </span>
                <span className="text-[10px] tracking-wider text-slate-400 font-bold uppercase mt-0.5">
                  Blood Registry
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/donors" className={linkClass}>
              <Search className="w-4 h-4" />
              Find Donors
            </NavLink>

            {user ? (
              <>
                <NavLink to="/profile" className={linkClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </NavLink>
                <NavLink to="/patient/requests" className={linkClass}>
                  <FileText className="w-4 h-4" />
                  My Requests
                </NavLink>
                <div className="h-6 w-px bg-slate-200 mx-2" />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {user.profile_image ? (
                      <img
                        src={user.profile_image.startsWith('/') ? `http://localhost:8000${user.profile_image}` : user.profile_image}
                        alt={user.full_name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase border border-slate-200">
                        {user.full_name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-slate-700 max-w-[120px] truncate">
                      {user.full_name.split(' ')[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="h-6 w-px bg-slate-200 mx-2" />
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm font-semibold">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm font-semibold">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <NavLink to="/" end onClick={() => setIsOpen(false)} className={mobileLinkClass}>
              Home
            </NavLink>
            <NavLink to="/donors" onClick={() => setIsOpen(false)} className={mobileLinkClass}>
              <Search className="w-5 h-5" />
              Find Donors
            </NavLink>
            {user && (
              <>
                <NavLink to="/profile" onClick={() => setIsOpen(false)} className={mobileLinkClass}>
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </NavLink>
                <NavLink to="/patient/requests" onClick={() => setIsOpen(false)} className={mobileLinkClass}>
                  <FileText className="w-5 h-5" />
                  My Requests
                </NavLink>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-slate-100">
            {user ? (
              <div className="px-4 space-y-3">
                <div className="flex items-center gap-3">
                  {user.profile_image ? (
                    <img
                      src={user.profile_image.startsWith('/') ? `http://localhost:8000${user.profile_image}` : user.profile_image}
                      alt={user.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm uppercase">
                      {user.full_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{user.full_name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="px-4 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary w-full text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="btn-primary w-full text-center"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
