import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './shared/context/AuthContext';

// Layouts & Shared Pages
import DashboardLayout from './shared/layouts/DashboardLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Loader from './shared/components/Loader';

// Admin Module Pages
import AdminDashboard from './admin/pages/AdminDashboard';
import UserManager from './admin/pages/UserManager';
import RequestManager from './admin/pages/RequestManager';
import DonationManager from './admin/pages/DonationManager';

// Donor Module Pages
import DonorDashboard from './donor/pages/DonorDashboard';
import DonorHistory from './donor/pages/DonorHistory';
import DonorProfile from './donor/pages/DonorProfile';
import DonorRegister from './donor/pages/Register';

// Patient Module Pages
import PatientDashboard from './patient/pages/PatientDashboard';
import BloodRequestList from './patient/pages/BloodRequestList';
import BloodRequestForm from './patient/pages/BloodRequestForm';
import TrackRequest from './patient/pages/TrackRequest';
import SearchDonors from './patient/pages/SearchDonors';
import PatientProfile from './patient/pages/PatientProfile';
import PatientRegister from './patient/pages/Register';

// Route guards
const RoleRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loader fullPage={true} text="Verifying authorization level..." />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect unauthorized users to their respective home
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'DONOR') return <Navigate to="/donor/dashboard" replace />;
    if (user.role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loader fullPage={true} text="Initializing view..." />;
  }
  
  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'DONOR') return <Navigate to="/donor/dashboard" replace />;
    if (user.role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
  }
  
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Landing */}
        <Route path="/" element={<Home />} />
        
        {/* Public Auth & Registration */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        <Route path="/admin/login" element={
          <PublicRoute>
            <Login preselectedRole="ADMIN" />
          </PublicRoute>
        } />

        <Route path="/donor/login" element={
          <PublicRoute>
            <Login preselectedRole="DONOR" />
          </PublicRoute>
        } />

        <Route path="/patient/login" element={
          <PublicRoute>
            <Login preselectedRole="PATIENT" />
          </PublicRoute>
        } />
        
        <Route path="/register/donor" element={
          <PublicRoute>
            <DonorRegister />
          </PublicRoute>
        } />
        
        <Route path="/register/patient" element={
          <PublicRoute>
            <PatientRegister />
          </PublicRoute>
        } />

        {/* Dashboard Unified Layout Protected Routes */}
        <Route element={<DashboardLayout />}>
          
          {/* Admin Protected Routes */}
          <Route path="/admin/dashboard" element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </RoleRoute>
          } />
          <Route path="/admin/users" element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <UserManager />
            </RoleRoute>
          } />
          <Route path="/admin/requests" element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <RequestManager />
            </RoleRoute>
          } />
          <Route path="/admin/donations" element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <DonationManager />
            </RoleRoute>
          } />

          {/* Donor Protected Routes */}
          <Route path="/donor/dashboard" element={
            <RoleRoute allowedRoles={['DONOR']}>
              <DonorDashboard />
            </RoleRoute>
          } />
          <Route path="/donor/alerts" element={
            <RoleRoute allowedRoles={['DONOR']}>
              <DonorDashboard />
            </RoleRoute>
          } />
          <Route path="/donor/history" element={
            <RoleRoute allowedRoles={['DONOR']}>
              <DonorHistory />
            </RoleRoute>
          } />
          <Route path="/donor/profile" element={
            <RoleRoute allowedRoles={['DONOR']}>
              <DonorProfile />
            </RoleRoute>
          } />

          {/* Patient Protected Routes */}
          <Route path="/patient/dashboard" element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <PatientDashboard />
            </RoleRoute>
          } />
          <Route path="/patient/requests" element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <BloodRequestList />
            </RoleRoute>
          } />
          <Route path="/patient/requests/create" element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <BloodRequestForm />
            </RoleRoute>
          } />
          <Route path="/patient/requests/:id/edit" element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <BloodRequestForm />
            </RoleRoute>
          } />
          <Route path="/patient/requests/:id/track" element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <TrackRequest />
            </RoleRoute>
          } />
          <Route path="/patient/search-donors" element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <SearchDonors />
            </RoleRoute>
          } />
          <Route path="/patient/profile" element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <PatientProfile />
            </RoleRoute>
          } />

        </Route>

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
