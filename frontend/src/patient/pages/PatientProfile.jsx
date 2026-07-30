import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Phone, MapPin, Save } from 'lucide-react';
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

export default function PatientProfile() {
  const { user, updateProfile } = useAuth();
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
      division: user?.division || '',
      district: user?.district || '',
      area: user?.area || '',
      address: user?.address || '',
    }
  });

  useEffect(() => {
    if (user) {
      setSelectedDivision(user.division || '');
      setValue('full_name', user.full_name);
      setValue('phone', user.phone);
      setValue('division', user.division);
      setValue('district', user.district);
      setValue('area', user.area);
      setValue('address', user.address);
    }
  }, [user, setValue]);

  const handleDivisionChange = (e) => {
    const division = e.target.value;
    setSelectedDivision(division);
    setValue('district', ''); // reset district select
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await updateProfile(data);
      setToast({ type: 'success', message: "Your profile details have been successfully updated!" });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to update profile details." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-slide-up">
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
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Manage Account</h1>
        <p className="text-sm text-slate-500 font-semibold mt-0.5">Manage patient identity credentials and contact information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
        
        {/* Core details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-650 border-b border-slate-100 pb-2">Account Vitals</h3>
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

        {/* Location details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-655 border-b border-slate-100 pb-2">Primary Location</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Division</label>
              <select
                className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
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
          <Input
            label="Address details"
            placeholder="e.g. House 14, Road 2, Sector 12"
            error={errors.address?.message}
            {...register('address', { required: 'Address detail is required' })}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            icon={Save}
          >
            Save Account Details
          </Button>
        </div>
      </form>
    </div>
  );
}
