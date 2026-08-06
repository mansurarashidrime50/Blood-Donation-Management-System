import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, Calendar, Heart, Shield, Activity, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const { register: authRegister } = useAuth();
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
    
    // Prepare the payload (map terms to terms_accepted)
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
      await authRegister(payload);
      // Automatically redirect to login after successful register, showing a toast could be nice
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
        <div className="glass-card p-8 bg-white shadow-md border border-slate-100">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Create Donor Account
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Join the life-saving শেষ আশা network. Fill in your details below.
            </p>
          </div>

          {/* Error Banner */}
          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Registration Error:</span>
                <p className="mt-0.5">{apiError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Section 1: Authentication */}
            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blood-50 text-blood-600 text-xs flex items-center justify-center font-bold">1</span>
                Account Credentials
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <User className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="input-field-icon"
                      {...register('full_name', { required: 'Full name is required' })}
                    />
                  </div>
                  {errors.full_name && <p className="text-xs text-red-500 font-semibold">{errors.full_name.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      className="input-field-icon"
                      {...register('email', {
                        required: 'Email address is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address format'
                        }
                      })}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 font-semibold">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      placeholder="Min 8 chars, symbols"
                      className="input-field-icon"
                      {...register('password', {
                        required: 'Password is required',
                        validate: validatePasswordStrength
                      })}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-red-500 font-semibold">{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      placeholder="Re-enter password"
                      className="input-field-icon"
                      {...register('confirm_password', {
                        required: 'Confirm password is required',
                        validate: (value) => value === passwordValue || 'Passwords do not match'
                      })}
                    />
                  </div>
                  {errors.confirm_password && <p className="text-xs text-red-500 font-semibold">{errors.confirm_password.message}</p>}
                </div>
              </div>
            </div>

            {/* Section 2: Vitals & Health Info */}
            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blood-50 text-blood-600 text-xs flex items-center justify-center font-bold">2</span>
                Vital Stats & Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Phone */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Phone className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      placeholder="+8801712345678"
                      className="input-field-icon"
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^\+?[0-9\s\-()]{10,20}$/,
                          message: 'Invalid phone format (10-20 digits)'
                        }
                      })}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 font-semibold">{errors.phone.message}</p>}
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Date of Birth</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Calendar className="w-5 h-5" />
                    </span>
                    <input
                      type="date"
                      className="input-field-icon"
                      {...register('dob', {
                        required: 'Date of birth is required',
                        validate: validateAge
                      })}
                    />
                  </div>
                  {errors.dob && <p className="text-xs text-red-500 font-semibold">{errors.dob.message}</p>}
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Gender</label>
                  <select
                    className="input-field"
                    {...register('gender', { required: 'Gender is required' })}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-500 font-semibold">{errors.gender.message}</p>}
                </div>

                {/* Blood Group */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Blood Group</label>
                  <select
                    className="input-field"
                    {...register('blood_group', { required: 'Blood group is required' })}
                  >
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  {errors.blood_group && <p className="text-xs text-red-500 font-semibold">{errors.blood_group.message}</p>}
                </div>

                {/* Weight */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Weight (kg)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Activity className="w-5 h-5" />
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Min 50"
                      className="input-field-icon"
                      {...register('weight', {
                        required: 'Weight is required',
                        min: { value: 50.0, message: 'Weight must be at least 50kg' }
                      })}
                    />
                  </div>
                  {errors.weight && <p className="text-xs text-red-500 font-semibold">{errors.weight.message}</p>}
                </div>

                {/* Last Donation Date */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Last Donation Date (Optional)</label>
                  <input
                    type="date"
                    className="input-field"
                    {...register('last_donation_date')}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Geolocation Address */}
            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blood-50 text-blood-600 text-xs flex items-center justify-center font-bold">3</span>
                Location & Geolocation Address
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Division */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Division</label>
                  <select
                    className="input-field"
                    {...register('division', {
                      required: 'Division is required',
                      onChange: (e) => {
                        setSelectedDivision(e.target.value);
                      }
                    })}
                  >
                    <option value="">Select Division</option>
                    {Object.keys(DIVISION_DISTRICTS).map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                  {errors.division && <p className="text-xs text-red-500 font-semibold">{errors.division.message}</p>}
                </div>

                {/* District */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">District</label>
                  <select
                    className="input-field"
                    disabled={!selectedDivision}
                    {...register('district', { required: 'District is required' })}
                  >
                    <option value="">Select District</option>
                    {selectedDivision &&
                      DIVISION_DISTRICTS[selectedDivision].map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                  </select>
                  {errors.district && <p className="text-xs text-red-500 font-semibold">{errors.district.message}</p>}
                </div>

                {/* Area */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Area / Sub-district</label>
                  <input
                    type="text"
                    placeholder="e.g. Banani"
                    className="input-field"
                    {...register('area', { required: 'Area is required' })}
                  />
                  {errors.area && <p className="text-xs text-red-500 font-semibold">{errors.area.message}</p>}
                </div>

                {/* Full Address */}
                <div className="space-y-1 sm:col-span-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Address Details</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <MapPin className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Flat, House, Road details"
                      className="input-field-icon"
                      {...register('address', { required: 'Full address is required' })}
                    />
                  </div>
                  {errors.address && <p className="text-xs text-red-500 font-semibold">{errors.address.message}</p>}
                </div>
              </div>
            </div>

            {/* Section 4: Medical conditions & Consent */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blood-50 text-blood-600 text-xs flex items-center justify-center font-bold">4</span>
                Medical Declarations & Consent
              </h3>

              {/* Medical Conditions */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Medical Conditions (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="List any medical history, chronic diseases, or regular medications..."
                  className="input-field py-2.5"
                  {...register('medical_conditions')}
                />
              </div>

              {/* Terms Checkbox */}
              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-2.5">
                  <input
                    id="terms_accepted"
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-300 text-blood-600 focus:ring-blood-500 mt-0.5 shrink-0"
                    {...register('terms_accepted', {
                      required: 'You must accept the terms and conditions to proceed'
                    })}
                  />
                  <label htmlFor="terms_accepted" className="text-sm text-slate-500 leading-normal font-medium">
                    I declare that the information provided is correct, and I agree to register as a voluntary donor under শেষ আশা.
                  </label>
                </div>
                {errors.terms_accepted && <p className="text-xs text-red-500 font-semibold">{errors.terms_accepted.message}</p>}
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-end">
              <Link to="/login" className="btn-secondary py-3.5 order-2 sm:order-1">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary py-3.5 px-8 order-1 sm:order-2 flex items-center justify-center gap-2"
              >
                {isLoading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isLoading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
