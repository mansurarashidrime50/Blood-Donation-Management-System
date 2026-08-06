import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, Menu, X, LogOut, Bell, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import sharedService from '../services/sharedService';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll notifications every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await sharedService.getNotifications({ limit: 5 });
      setNotifications(response.data.items || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await sharedService.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await sharedService.markAllNotificationsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    setShowNotifications(false);
    if (!notif.is_read) {
      try {
        await sharedService.markNotificationRead(notif.id);
        fetchNotifications();
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
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
                <Droplet className="w-6 h-6 text-red-655 fill-red-600 animate-pulse" />
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
                  className="text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors"
                >
                  Dashboard
                </Link>
                {user.role === 'DONOR' && (
                  <Link
                    to="/donor/history"
                    className="text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors"
                  >
                    Donation History
                  </Link>
                )}
                {user.role === 'PATIENT' && (
                  <Link
                    to="/patient/search-donors"
                    className="text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors"
                  >
                    Search Donors
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin/users"
                    className="text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors"
                  >
                    Users Manager
                  </Link>
                )}
                
                {/* Notifications Bell Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all relative cursor-pointer"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                      <div className="p-3.5 border-b border-slate-50 flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">In-App Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-0.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Mark all read
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-1.5">
                            <AlertCircle className="w-8 h-8 text-slate-300" />
                            <span className="text-xs font-semibold">No new notifications</span>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left flex flex-col gap-1 ${
                                !notif.is_read ? 'bg-red-50/20' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-bold text-xs text-slate-800 leading-tight">{notif.title}</span>
                                {!notif.is_read && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                    className="p-1 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                    title="Mark as Read"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] font-semibold text-slate-500 leading-normal">{notif.content}</p>
                              <span className="text-[9px] font-bold text-slate-400 mt-1">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

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
                    className="p-2 rounded-xl text-slate-450 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
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
