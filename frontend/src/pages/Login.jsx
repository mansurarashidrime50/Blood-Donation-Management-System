import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Droplet, CheckCircle, Heart, Users, Shield } from 'lucide-react';
import { useAuth } from '../shared/context/AuthContext';
import Button from '../shared/components/Button';
import Input from '../shared/components/Input';
import Toast from '../shared/components/Toast';

export default function Login({ preselectedRole }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Parse initial role from URL query param (?role=DONOR or ?role=PATIENT) or props
  const params = new URLSearchParams(location.search);
  const roleFromUrl = (params.get('role') || '').toUpperCase();
  const activeRole = (preselectedRole || roleFromUrl || 'DONOR').toUpperCase();
  const [selectedRole, setSelectedRole] = useState(activeRole === 'PATIENT' ? 'PATIENT' : activeRole === 'ADMIN' ? 'ADMIN' : 'DONOR');

  // Check if routed from successful registration
  const wasRegistered = location.state?.registered || false;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const userData = await login(data.email, data.password);
      
      // Redirect based on role
      if (userData.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (userData.role === 'DONOR') {
        navigate('/donor/dashboard');
      } else if (userData.role === 'PATIENT') {
        navigate('/patient/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setApiError(
        err.response?.data?.detail || 'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        {/* Card Container */}
        <div className="glass-card p-8 shadow-md border border-slate-100 bg-white rounded-2xl">
          {/* Header Title */}
          <div className="text-center space-y-2 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto transition-colors duration-300 ${
              selectedRole === 'DONOR' ? 'bg-red-50 text-red-650' :
              selectedRole === 'PATIENT' ? 'bg-slate-100 text-slate-800' :
              'bg-indigo-50 text-indigo-650'
            }`}>
              {selectedRole === 'DONOR' ? (
                <Heart className="w-6 h-6 fill-red-650" />
              ) : selectedRole === 'PATIENT' ? (
                <Users className="w-6 h-6" />
              ) : (
                <Shield className="w-6 h-6" />
              )}
            </div>
            <div className={`text-[10px] font-black tracking-wider uppercase transition-colors duration-300 ${
              selectedRole === 'DONOR' ? 'text-red-600' :
              selectedRole === 'PATIENT' ? 'text-slate-800' :
              'text-indigo-650'
            }`}>
              শেষ আশা - Blood Link
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {selectedRole === 'DONOR' ? 'Donor Sign In' :
               selectedRole === 'PATIENT' ? 'Patient Sign In' :
               'Admin Login'}
            </h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xs mx-auto">
              {selectedRole === 'DONOR' ? 'Sign In to manage availability, view blood requests, and respond to donations.' :
               selectedRole === 'PATIENT' ? 'Sign In to request blood, track active requests, and find registered donors.' :
               'Access the platform control center to manage system users and requests.'}
            </p>
          </div>

          {/* Role selector Tabs */}
          {!preselectedRole && (
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 mb-6">
              <button
                type="button"
                onClick={() => setSelectedRole('DONOR')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                  selectedRole === 'DONOR'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${selectedRole === 'DONOR' ? 'fill-white' : ''}`} />
                Donor
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('PATIENT')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                  selectedRole === 'PATIENT'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Patient
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('ADMIN')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                  selectedRole === 'ADMIN'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </button>
            </div>
          )}

          {/* Registration Success Banner */}
          {wasRegistered && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">Registration successful! Please Sign In.</span>
            </div>
          )}

          {/* Global API Error Alert */}
          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-semibold">{apiError}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email Address"
              icon={Mail}
              placeholder="name@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address format'
                }
              })}
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />

            <Button
              type="submit"
              variant={selectedRole === 'DONOR' ? 'danger' : selectedRole === 'PATIENT' ? 'primary' : 'secondary'}
              className="w-full"
              isLoading={isLoading}
              icon={LogIn}
            >
              Sign In
            </Button>
          </form>

          {/* Dynamic Link selectors */}
          <div className="text-center mt-6 text-xs text-slate-500 font-semibold space-y-2 pt-2 border-t border-slate-100">
            {selectedRole === 'DONOR' && (
              <div>
                Want to donate?{' '}
                <Link to="/register/donor" className="text-red-650 hover:underline font-extrabold">
                  Register as Donor
                </Link>
              </div>
            )}
            {selectedRole === 'PATIENT' && (
              <div>
                Need blood?{' '}
                <Link to="/register/patient" className="text-slate-800 hover:underline font-extrabold">
                  Register as Patient
                </Link>
              </div>
            )}
            {selectedRole === 'ADMIN' && (
              <div className="text-slate-400 font-normal">
                Authorized Admin access only.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
