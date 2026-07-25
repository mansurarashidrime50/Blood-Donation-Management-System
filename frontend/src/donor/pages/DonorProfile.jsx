import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Phone, Calendar, Heart, MapPin, Activity, AlertCircle, Save, Camera, Check } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import Button from '../../shared/components/Button';
import Input from '../../shared/components/Input';
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

export default function DonorProfile() {
  const { user, updateProfile, updateProfileImage } = useAuth();
  const [selectedDivision, setSelectedDivision] = useState(user?.division || '');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      dob: user?.dob || '',
      gender: user?.gender || '',
      blood_group: user?.blood_group || '',
      division: user?.division || '',
      district: user?.district || '',
      area: user?.area || '',
      address: user?.address || '',
      weight: user?.weight || '',
      medical_conditions: user?.medical_conditions || '',
      availability: user?.availability ?? true,
    }
  });

  useEffect(() => {
    if (user) {
      setSelectedDivision(user.division || '');
      setValue('full_name', user.full_name);
      setValue('phone', user.phone);
      setValue('dob', user.dob);
      setValue('gender', user.gender);
      setValue('blood_group', user.blood_group);
      setValue('division', user.division);
      setValue('district', user.district);
      setValue('area', user.area);
      setValue('address', user.address);
      setValue('weight', user.weight);
      setValue('medical_conditions', user.medical_conditions || '');
      setValue('availability', user.availability);
    }
  }, [user, setValue]);

  const handleDivisionChange = (e) => {
    const division = e.target.value;
    setSelectedDivision(division);
    setValue('district', ''); // reset district select
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await updateProfileImage(file);
      setToast({ type: 'success', message: "Profile image updated successfully!" });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to upload image." });
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        weight: parseFloat(data.weight),
      };
      await updateProfile(payload);
      setToast({ type: 'success', message: "Your profile details have been successfully saved!" });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to update profile details." });
    } finally {
      setLoading(false);
    }
  };

  const validateAge = (dobString) => {
    if (!dobString) return true;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 18 || 'You must be at least 18 years old to register';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-slide-up">
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
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Edit Profile</h1>
        <p className="text-sm text-slate-500 font-semibold mt-0.5">Manage your credentials, vital health metrics, and location mappings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Avatar Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm text-center space-y-4 md:col-span-1">
          <div className="relative w-32 h-32 mx-auto group">
            {user?.profile_image ? (
              <img
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.profile_image}`}
                alt={user.full_name}
                className="w-full h-full rounded-full object-cover border border-slate-200"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'; }}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-red-50 text-red-650 flex items-center justify-center font-bold text-4xl">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Image Upload Trigger */}
            <label className="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6" />
              <input type="file" onChange={handleImageUpload} accept="image/*" className="hidden" />
            </label>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{user?.full_name}</h3>
            <span className="text-xs font-bold text-red-600 bg-red-50 py-0.5 px-3 rounded-full mt-1.5 inline-block uppercase tracking-wider">
              {user?.blood_group || 'No blood group'}
            </span>
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Role: {user?.role}</span>
            <span>Account: {user?.status}</span>
          </div>
        </div>

        {/* Right Side: Details Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm md:col-span-2 space-y-6">
          
          {/* Identity Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 border-b border-slate-100 pb-2">1. Identity & Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                icon={User}
                error={errors.full_name?.message}
                {...register('full_name', { required: 'Name is required' })}
              />
              <Input
                label="Contact Phone"
                icon={Phone}
                error={errors.phone?.message}
                {...register('phone', { required: 'Phone is required' })}
              />
            </div>
          </div>

          {/* Vitals Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 border-b border-slate-100 pb-2">2. Vitals & Medicals</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Date of Birth</label>
                <input
                  type="date"
                  className={`w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 ${errors.dob ? 'border-red-300' : ''}`}
                  {...register('dob', { required: 'DOB is required', validate: validateAge })}
                />
                {errors.dob && <p className="text-xs text-red-500 font-semibold">{errors.dob.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Gender</label>
                <select
                  className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                  {...register('gender', { required: 'Gender is required' })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Blood Group</label>
                <select
                  className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                  {...register('blood_group', { required: 'Blood group is required' })}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Weight (kg)"
                type="number"
                step="0.1"
                icon={Activity}
                error={errors.weight?.message}
                {...register('weight', { required: 'Weight is required', min: { value: 50, message: 'Weight must be at least 50 kg' } })}
              />
              <Input
                label="Medical Conditions"
                placeholder="e.g. Asthma, High BP or None"
                icon={AlertCircle}
                {...register('medical_conditions')}
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 border-b border-slate-100 pb-2">3. Location details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Division</label>
                <select
                  className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                  {...register('division', { required: 'Division is required' })}
                  onChange={handleDivisionChange}
                >
                  <option value="">Select Division</option>
                  {Object.keys(DIVISION_DISTRICTS).map((div) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">District</label>
                <select
                  className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                  {...register('district', { required: 'District is required' })}
                  disabled={!selectedDivision}
                >
                  <option value="">Select District</option>
                  {selectedDivision && DIVISION_DISTRICTS[selectedDivision].map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Area"
                placeholder="e.g. Mirpur, Uttara"
                icon={MapPin}
                error={errors.area?.message}
                {...register('area', { required: 'Area is required' })}
              />
            </div>
            <Input
              label="Full Address details"
              placeholder="House 12, Road 4, Block B"
              error={errors.address?.message}
              {...register('address', { required: 'Address is required' })}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              icon={Save}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
