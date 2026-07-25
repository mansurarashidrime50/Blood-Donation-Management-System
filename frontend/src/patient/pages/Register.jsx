import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, AlertCircle, Droplet } from 'lucide-react';
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

export default function Register() {
  const { registerPatient } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError(null);
    
    const payload = {
      full_name: data.full_name,
      email: data.email,
      password: data.password,
      confirm_password: data.confirm_password,
      phone: data.phone,
      blood_group: data.blood_group || null,
      division: data.division,
      district: data.district,
      area: data.area,
      address: data.address || null,
      gender: data.gender || null,
      dob: data.dob || null
    };

    try {
      await registerPatient(payload);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      console.error(err);
      setApiError(
        err.response?.data?.detail || 'Patient registration failed.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validatePasswordStrength = (pass) => {
    if (!pass) return true;
    if (pass.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pass)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least one number';
    return true;
  };

  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-8 animate-slide-up">
        <div className="glass-card p-8 bg-white shadow-md border border-slate-100 rounded-2xl">
          <div className="text-center space-y-2 mb-8">
            <div className="text-sm font-black tracking-wider text-red-655 uppercase">শেষ আশা - Blood Link</div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Register as Patient
            </h2>
            <p className="text-sm text-slate-500 font-semibold">
              Create an account to request blood and track matching donor offers.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-semibold">{apiError}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Vitals */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-655 border-b border-slate-100 pb-2">1. Identity & Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  icon={User}
                  placeholder="e.g. Jane Doe"
                  error={errors.full_name?.message}
                  {...register('full_name', { required: 'Name is required' })}
                />
                <Input
                  label="Email Address"
                  icon={Mail}
                  placeholder="email@example.com"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address format'
                    }
                  })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Phone"
                  icon={Phone}
                  placeholder="e.g. 01712345678"
                  error={errors.phone?.message}
                  {...register('phone', { required: 'Phone number is required' })}
                />
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient Blood Group (Optional)</label>
                  <select
                    className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                    {...register('blood_group')}
                  >
                    <option value="">Select Blood Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  icon={Lock}
                  error={errors.password?.message}
                  {...register('password', { required: 'Password is required', validate: validatePasswordStrength })}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  icon={Lock}
                  error={errors.confirm_password?.message}
                  {...register('confirm_password', {
                    required: 'Please confirm password',
                    validate: (value) => value === passwordValue || 'Passwords do not match'
                  })}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-655 border-b border-slate-100 pb-2">2. Location</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Division</label>
                  <select
                    className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
                    {...register('division', { required: 'Division is required' })}
                    onChange={(e) => {
                      setSelectedDivision(e.target.value);
                      setValue('district', '');
                    }}
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
                    className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
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
                  placeholder="e.g. Uttara"
                  icon={MapPin}
                  error={errors.area?.message}
                  {...register('area', { required: 'Area is required' })}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Complete Patient Registration
            </Button>
          </form>

          <div className="text-center mt-6 text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-red-655 hover:underline font-bold">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
