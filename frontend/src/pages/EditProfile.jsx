import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Activity, Calendar, Info, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EditProfile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      weight: user?.weight || '',
      last_donation_date: user?.last_donation_date || '',
      medical_conditions: user?.medical_conditions || '',
      availability: user?.availability ?? true,
    },
  });

  if (!user) {
    return (
      <div className="flex-1 py-16 flex items-center justify-center">
        <p className="text-slate-500 font-semibold">Redirecting...</p>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const payload = {
        full_name: data.full_name,
        phone: data.phone,
        address: data.address,
        weight: parseFloat(data.weight),
        last_donation_date: data.last_donation_date || null,
        medical_conditions: data.medical_conditions || null,
        availability: data.availability,
      };

      await updateProfile(payload);
      navigate('/profile');
    } catch (err) {
      console.error(err);
      setApiError(err.response?.data?.detail || 'Failed to update profile. Please verify input data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
        {/* Card wrapper */}
        <div className="glass-card p-8 bg-white shadow-sm border border-slate-100">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Edit Profile Information</h1>
            <p className="text-sm text-slate-500 font-medium">Update your public details and health parameters</p>
          </div>

          {/* API Error Alert */}
          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-semibold">{apiError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Disabled Email view */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address (Cannot be changed)</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input-field bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed select-none"
              />
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  className={`input-field pl-10 ${errors.full_name ? 'border-red-300' : ''}`}
                  {...register('full_name', { required: 'Name is required' })}
                />
              </div>
              {errors.full_name && <p className="text-xs text-red-500 font-semibold">{errors.full_name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="+8801712345678"
                    className={`input-field pl-10 ${errors.phone ? 'border-red-300' : ''}`}
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^\+?[0-9\s\-()]{10,20}$/,
                        message: 'Invalid phone number format',
                      },
                    })}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 font-semibold">{errors.phone.message}</p>}
              </div>

              {/* Weight */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Weight (kg)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Activity className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Min 50"
                    className={`input-field pl-10 ${errors.weight ? 'border-red-300' : ''}`}
                    {...register('weight', {
                      required: 'Weight is required',
                      min: { value: 50.0, message: 'Weight must be at least 50kg' },
                    })}
                  />
                </div>
                {errors.weight && <p className="text-xs text-red-500 font-semibold">{errors.weight.message}</p>}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Street Address Details</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="House, Road, Area details"
                  className={`input-field pl-10 ${errors.address ? 'border-red-300' : ''}`}
                  {...register('address', { required: 'Street address is required' })}
                />
              </div>
              {errors.address && <p className="text-xs text-red-500 font-semibold">{errors.address.message}</p>}
            </div>

            {/* Last Donation Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Last Blood Donation Date (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  className="input-field pl-10"
                  {...register('last_donation_date')}
                />
              </div>
            </div>

            {/* Medical Info */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Medical Conditions & Medications (Optional)</label>
              <textarea
                rows="3"
                placeholder="List allergies, regular medications, or recent health events..."
                className="input-field py-2.5"
                {...register('medical_conditions')}
              />
            </div>

            {/* Availability checkbox */}
            <div className="flex items-center gap-2.5 pt-2">
              <input
                id="availability"
                type="checkbox"
                className="w-5 h-5 rounded border-slate-300 text-blood-600 focus:ring-blood-500 shrink-0 cursor-pointer"
                {...register('availability')}
              />
              <label htmlFor="availability" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                Show my profile as available for instant donation calls
              </label>
            </div>

            {/* Form controls */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="btn-secondary py-3 px-5 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary py-3 px-6 text-sm flex items-center gap-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
