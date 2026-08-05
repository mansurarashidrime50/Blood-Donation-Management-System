import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, Calendar, Heart, Shield, Activity, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
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
  const { registerDonor } = useAuth();
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
      dob: data.dob,
      gender: data.gender,
      blood_group: data.blood_group,
      division: data.division,
      district: data.district,
      area: data.area,
      address: data.address,
      weight: parseFloat(data.weight),
      last_donation_date: data.last_donation_date || null,
      medical_conditions: data.medical_conditions || null,
      terms_accepted: data.terms_accepted,
      availability: true
    };

    try {
      await registerDonor(payload);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      console.error(err);
      setApiError(
        err.response?.data?.detail || 'Registration failed. Please check the entered data.'
      );
    } finally {
      setIsLoading(false);
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

  const validatePasswordStrength = (pass) => {
    if (!pass) return true;
    if (pass.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pass)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return 'Password must contain at least one special character';
    return true;
  };

  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
        {/* Card wrapper */}
        <div className="glass-card p-8 bg-white shadow-md border border-slate-100 rounded-2xl">
          <div className="text-center space-y-2 mb-8">
            <div className="text-sm font-black tracking-wider text-red-650 uppercase">শেষ আশা - Blood Link</div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Become a Blood Donor
            </h2>
            <p className="text-sm text-slate-500 font-semibold">
              Fill in your health and location details to join the lifesaver registry.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-semibold">{apiError}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Section 1: Core Credentials */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 border-b border-slate-100 pb-2">1. Credentials & Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  icon={User}
                  placeholder="e.g. John Doe"
                  error={errors.full_name?.message}
                  {...register('full_name', { required: 'Full name is required' })}
                />
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Contact Phone"
                    icon={Phone}
                    placeholder="e.g. 01712345678"
                    error={errors.phone?.message}
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^\+?[0-9\s\-()]{10,20}$/,
                        message: 'Must be between 10 and 20 digits'
                      }
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Date of Birth</label>
                  <input
                    type="date"
                    className={`w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 ${errors.dob ? 'border-red-300' : ''}`}
                    {...register('dob', { required: 'DOB is required', validate: validateAge })}
                  />
                  {errors.dob && <p className="text-xs text-red-500 font-semibold mt-0.5">{errors.dob.message}</p>}
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

            {/* Section 2: Vitals */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 border-b border-slate-100 pb-2">2. Health Vitals</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Gender</label>
                  <select
                    className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                    {...register('gender', { required: 'Gender is required' })}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-500 font-semibold mt-0.5">{errors.gender.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Blood Group</label>
                  <select
                    className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
                    {...register('blood_group', { required: 'Blood group is required' })}
                  >
                    <option value="">Select Blood Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  {errors.blood_group && <p className="text-xs text-red-500 font-semibold mt-0.5">{errors.blood_group.message}</p>}
                </div>

                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  icon={Activity}
                  error={errors.weight?.message}
                  {...register('weight', { required: 'Weight is required', min: { value: 50, message: 'Weight must be at least 50 kg' } })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Last Donation Date (Optional)</label>
                  <input
                    type="date"
                    className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
                    {...register('last_donation_date')}
                  />
                </div>
                <Input
                  label="Medical Conditions"
                  placeholder="e.g. None, Asthma"
                  icon={AlertCircle}
                  {...register('medical_conditions')}
                />
              </div>
            </div>

            {/* Section 3: Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-600 border-b border-slate-100 pb-2">3. Primary Location</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Division</label>
                  <select
                    className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
                    {...register('division', { 
                      required: 'Division is required',
                      onChange: (e) => {
                        setSelectedDivision(e.target.value);
                        setValue('district', '');
                      }
                    })}
                  >
                    <option value="">Select Division</option>
                    {Object.keys(DIVISION_DISTRICTS).map((div) => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                  {errors.division && <p className="text-xs text-red-500 font-semibold mt-0.5">{errors.division.message}</p>}
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
                  {errors.district && <p className="text-xs text-red-500 font-semibold mt-0.5">{errors.district.message}</p>}
                </div>

                <Input
                  label="Area"
                  placeholder="e.g. Mirpur, Sector 4"
                  icon={MapPin}
                  error={errors.area?.message}
                  {...register('area', { required: 'Area is required' })}
                />
              </div>
              <Input
                label="Full Address Details"
                placeholder="House 10, Road 5"
                error={errors.address?.message}
                {...register('address', { required: 'Address detail is required' })}
              />
            </div>

            {/* Consent Checkbox */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="terms_accepted"
                  className="w-4.5 h-4.5 text-red-600 border-slate-300 rounded focus:ring-red-500 mt-0.5"
                  {...register('terms_accepted', { required: 'You must agree to register as a donor.' })}
                />
                <label htmlFor="terms_accepted" className="text-xs font-semibold text-slate-550 cursor-pointer">
                  I agree that I am at least 18 years old, weigh above 50kg, and the medical information I provided is correct and true.
                </label>
              </div>
              {errors.terms_accepted && <p className="text-xs text-red-500 font-bold">{errors.terms_accepted.message}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Complete Donor Registration
            </Button>
          </form>

          <div className="text-center mt-6 text-xs text-slate-500 font-medium">
            Already have a lifesaver account?{' '}
            <Link to="/login" className="text-red-650 hover:underline font-bold">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
