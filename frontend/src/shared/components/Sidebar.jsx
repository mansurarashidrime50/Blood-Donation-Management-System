import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Users, Heart, Award, Bell, ClipboardList, 
  User, Settings, PlusCircle, Activity, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();

  if (!user) return null;

  const renderAdminLinks = () => (
    <>
      <NavLink
        to="/admin/dashboard"
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'bg-red-50 text-red-600 font-bold border-r-4 border-red-500' : 'text-slate-600 hover:bg-slate-50'}`
        }
      >
        <Home className="w-5 h-5" />
        <span>Dashboard</span>
      </NavLink>
      <NavLink
        to="/admin/users"
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'bg-red-50 text-red-600 font-bold border-r-4 border-red-500' : 'text-slate-600 hover:bg-slate-50'}`
        }
      >
        <Users className="w-5 h-5" />
        <span>Users Manager</span>
      </NavLink>
      <NavLink
        to="/admin/requests"
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'bg-red-50 text-red-600 font-bold border-r-4 border-red-500' : 'text-slate-600 hover:bg-slate-50'}`
        }
      >
        <Heart className="w-5 h-5" />
        <span>Blood Requests</span>
      </NavLink>
      <NavLink
        to="/admin/donations"
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'bg-red-50 text-red-600 font-bold border-r-4 border-red-500' : 'text-slate-600 hover:bg-slate-50'}`
        }
      >
        <ClipboardList className="w-5 h-5" />
        <span>Donations Log</span>
      </NavLink>
    </>
  );

  const renderDonorLinks = () => (
    <>
      <NavLink
        to="/donor/dashboard"
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'bg-red-50 text-red-600 font-bold border-r-4 border-red-500' : 'text-slate-600 hover:bg-slate-50'}`
        }
      >
        <Home className="w-5 h-5" />
        <span>Dashboard</span>
      </NavLink>
      <NavLink
        to="/donor/history"
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'bg-red-50 text-red-600 font-bold border-r-4 border-red-500' : 'text-slate-600 hover:bg-slate-50'}`
        }
      >
        <Award className="w-5 h-5" />
        <span>Donation History</span>
      </NavLink>
      <NavLink
        to="/donor/profile"
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'bg-red-50 text-red-600 font-bold border-r-4 border-red-500' : 'text-slate-600 hover:bg-slate-50'}`
        }
      >
        <User className="w-5 h-5" />
        <span>My Profile</span>
      </NavLink>
    </>
  );

  const renderPatientLinks = () => (
    <>
      <NavLink
        to="/patient/dashboard"
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'bg-red-50 text-red-600 font-bold border-r-4 border-red-500' : 'text-slate-600 hover:bg-slate-50'}`
        }
      >
        <Home className="w-5 h-5" />
        <span>Overview</span>
      </NavLink>
      <NavLink
        to="/patient/requests/create"
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'bg-red-50 text-red-600 font-bold border-r-4 border-red-500' : 'text-slate-600 hover:bg-slate-50'}`
        }
      >
        <PlusCircle className="w-5 h-5" />
        <span>Request Blood</span>
      </NavLink>
      <NavLink
        to="/patient/search-donors"
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'bg-red-50 text-red-600 font-bold border-r-4 border-red-500' : 'text-slate-600 hover:bg-slate-50'}`
        }
      >
        <Search className="w-5 h-5" />
        <span>Search Donors</span>
      </NavLink>
      <NavLink
        to="/patient/profile"
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'bg-red-50 text-red-600 font-bold border-r-4 border-red-500' : 'text-slate-600 hover:bg-slate-50'}`
        }
      >
        <User className="w-5 h-5" />
        <span>My Profile</span>
      </NavLink>
    </>
  );

  return (
    <aside className="w-64 hidden lg:flex flex-col bg-white border-r border-slate-100 min-h-[calc(100vh-4rem)] p-4 space-y-2 shrink-0">
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        Menu ({user.role})
      </div>
      <nav className="flex-1 space-y-1">
        {user.role === 'ADMIN' && renderAdminLinks()}
        {user.role === 'DONOR' && renderDonorLinks()}
        {user.role === 'PATIENT' && renderPatientLinks()}
      </nav>
    </aside>
  );
}
