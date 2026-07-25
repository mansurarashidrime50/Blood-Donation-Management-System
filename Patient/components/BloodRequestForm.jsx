import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Activity, MapPin, Hospital, Calendar, Phone, FileText, AlertCircle, Save } from 'lucide-react';

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

export default function BloodRequestForm({ initialData = null, onSubmit, isLoading = false, isEdit = false }) {
  const [selectedDivision, setSelectedDivision] = useState(initialData?.division || '');
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      patient_name: initialData?.patient_name || '',
      blood_group_required: initialData?.blood_group_required || '',
      blood_units_needed: initialData?.blood_units_needed || 1,
      hospital_name: initialData?.hospital_name || '',
      division: initialData?.division || '',
      district: initialData?.district || '',
      emergency_level: initialData?.emergency_level || 'Normal',
      required_date: initialData?.required_date || '',
      contact_number: initialData?.contact_number || '',
      additional_notes: initialData?.additional_notes || '',
      request_status: initialData?.request_status || 'Pending',
    }
  });

  // Watch for division updates to reload district selections
  useEffect(() => {
    if (initialData) {
      setSelectedDivision(initialData.division);
      setValue('division', initialData.division);
      setValue('district', initialData.district);
    }
  }, [initialData, setValue]);

  const handleDivisionChange = (e) => {
    const division = e.target.value;
    setSelectedDivision(division);
    setValue('district', ''); // reset district select
  };

  const validateRequiredDate = (value) => {
    if (!value) return true;
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today || 'Required date cannot be in the past';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {/* Vitals and Patient Name */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Patient Name */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <User className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="e.g. Rahim Uddin"
              className={`input-field-icon ${errors.patient_name ? 'border-red-300' : ''}`}
              {...register('patient_name', { required: 'Patient name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
            />
          </div>
          {errors.patient_name && <p className="text-xs text-red-500 font-semibold">{errors.patient_name.message}</p>}
        </div>

        {/* Blood Group Required */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Blood Group Required</label>
          <select
            className={`input-field ${errors.blood_group_required ? 'border-red-300' : ''}`}
            {...register('blood_group_required', { required: 'Blood group is required' })}
          >
            <option value="">Select Blood Group</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
          {errors.blood_group_required && <p className="text-xs text-red-500 font-semibold">{errors.blood_group_required.message}</p>}
        </div>
      </div>

      {/* Units and Emergency level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Blood Units Needed */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Blood Units Needed</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Activity className="w-5 h-5" />
            </span>
            <input
              type="number"
              min="1"
              placeholder="e.g. 1"
              className={`input-field-icon ${errors.blood_units_needed ? 'border-red-300' : ''}`}
              {...register('blood_units_needed', {
                required: 'Units needed is required',
                min: { value: 1, message: 'Units must be greater than 0' },
                valueAsNumber: true
              })}
            />
          </div>
          {errors.blood_units_needed && <p className="text-xs text-red-500 font-semibold">{errors.blood_units_needed.message}</p>}
        </div>

        {/* Emergency Level */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Emergency Level</label>
          <select
            className="input-field"
            {...register('emergency_level', { required: 'Emergency level is required' })}
          >
            <option value="Normal">Normal</option>
            <option value="Urgent">Urgent</option>
            <option value="Critical">Critical</option>
          </select>
          {errors.emergency_level && <p className="text-xs text-red-500 font-semibold">{errors.emergency_level.message}</p>}
        </div>

        {/* Date Required */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Required Date</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Calendar className="w-5 h-5" />
            </span>
            <input
              type="date"
              className={`input-field-icon ${errors.required_date ? 'border-red-300' : ''}`}
              {...register('required_date', {
                required: 'Required date is required',
                validate: validateRequiredDate
              })}
            />
          </div>
          {errors.required_date && <p className="text-xs text-red-500 font-semibold">{errors.required_date.message}</p>}
        </div>
      </div>

      {/* Hospital and Location */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hospital Name */}
        <div className="space-y-1 md:col-span-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Hospital Name & Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Hospital className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="e.g. Square Hospital, Panthapath, Dhaka"
              className={`input-field-icon ${errors.hospital_name ? 'border-red-300' : ''}`}
              {...register('hospital_name', { required: 'Hospital name is required', minLength: { value: 2, message: 'Hospital address must be at least 2 characters' } })}
            />
          </div>
          {errors.hospital_name && <p className="text-xs text-red-500 font-semibold">{errors.hospital_name.message}</p>}
        </div>

        {/* Division */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Division</label>
          <select
            className={`input-field ${errors.division ? 'border-red-300' : ''}`}
            {...register('division', {
              required: 'Division is required',
              onChange: handleDivisionChange
            })}
          >
            <option value="">Select Division</option>
            {Object.keys(DIVISION_DISTRICTS).map((div) => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
          {errors.division && <p className="text-xs text-red-500 font-semibold">{errors.division.message}</p>}
        </div>

        {/* District */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">District</label>
          <select
            className={`input-field ${errors.district ? 'border-red-300' : ''}`}
            disabled={!selectedDivision}
            {...register('district', { required: 'District is required' })}
          >
            <option value="">Select District</option>
            {selectedDivision &&
              DIVISION_DISTRICTS[selectedDivision].map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
          </select>
          {errors.district && <p className="text-xs text-red-500 font-semibold">{errors.district.message}</p>}
        </div>

        {/* Contact Phone */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Number (BD)</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Phone className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="e.g. 01712345678"
              className={`input-field-icon ${errors.contact_number ? 'border-red-300' : ''}`}
              {...register('contact_number', {
                required: 'Contact number is required',
                pattern: {
                  value: /^(?:\+88|88)?(01[3-9]\d{8})$/,
                  message: 'Must be a valid Bangladesh mobile number'
                }
              })}
            />
          </div>
          {errors.contact_number && <p className="text-xs text-red-500 font-semibold">{errors.contact_number.message}</p>}
        </div>
      </div>

      {/* Edit Mode Status & Notes */}
      <div className="grid grid-cols-1 gap-4">
        {isEdit && (
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Request Status</label>
            <select
              className="input-field"
              {...register('request_status', { required: 'Request status is required' })}
            >
              <option value="Pending">Pending</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {/* Additional Notes */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Additional Notes (Optional)</label>
          <div className="relative">
            <span className="absolute top-3.5 left-3.5 text-slate-400 pointer-events-none">
              <FileText className="w-5 h-5" />
            </span>
            <textarea
              rows="4"
              placeholder="Write any emergency details, blood recipient name, or special instructions here..."
              className="input-field pl-12 py-3"
              {...register('additional_notes', { maxLength: { value: 500, message: 'Notes cannot exceed 500 characters' } })}
            />
          </div>
          {errors.additional_notes && <p className="text-xs text-red-500 font-semibold">{errors.additional_notes.message}</p>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary py-3 px-8 text-sm flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isLoading ? 'Saving Blood Request...' : isEdit ? 'Update Blood Request' : 'Post Blood Request'}
        </button>
      </div>
      
    </form>
  );
}
