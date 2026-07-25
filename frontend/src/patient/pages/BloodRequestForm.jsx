import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Activity, MapPin, Hospital, Calendar, Phone, FileText, AlertCircle, Save, ArrowLeft } from 'lucide-react';
import patientService from '../services/patientService';
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

export default function BloodRequestForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  
  const [selectedDivision, setSelectedDivision] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [toast, setToast] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      patient_name: '',
      blood_group_required: '',
      blood_units_needed: 1,
      hospital_name: '',
      division: '',
      district: '',
      emergency_level: 'Normal',
      required_date: '',
      contact_number: '',
      additional_notes: '',
    }
  });

  useEffect(() => {
    if (isEdit) {
      const fetchRequestData = async () => {
        setFetching(true);
        try {
          const response = await patientService.getRequest(id);
          const data = response.data;
          
          setValue('patient_name', data.patient_name);
          setValue('blood_group_required', data.blood_group_required);
          setValue('blood_units_needed', data.blood_units_needed);
          setValue('hospital_name', data.hospital_name);
          setValue('division', data.division);
          setSelectedDivision(data.division);
          setValue('district', data.district);
          setValue('emergency_level', data.emergency_level);
          setValue('required_date', data.required_date);
          setValue('contact_number', data.contact_number);
          setValue('additional_notes', data.additional_notes || '');
        } catch (err) {
          console.error(err);
          setToast({ type: 'error', message: "Failed to retrieve blood request details." });
        } finally {
          setFetching(false);
        }
      };
      fetchRequestData();
    }
  }, [id, isEdit, setValue]);

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

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        blood_units_needed: parseInt(data.blood_units_needed),
      };
      
      if (isEdit) {
        await patientService.updateRequest(id, payload);
        setToast({ type: 'success', message: "Blood request updated successfully!" });
      } else {
        await patientService.createRequest(payload);
        setToast({ type: 'success', message: "Blood request created successfully!" });
      }
      setTimeout(() => navigate('/patient/dashboard'), 1500);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to submit blood request details." });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center py-12 text-slate-500 font-bold">Loading request details...</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-slide-up">
      {toast && (
        <div className="fixed top-4 right-4 z-50 min-w-[320px]">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header toolbar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/patient/dashboard')}
          className="p-2 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {isEdit ? 'Modify Request' : 'Create Request'}
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-0.5">
            {isEdit ? 'Update details of your existing request' : 'Publish a new request to locate blood donors'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
        
        {/* Patient & Group */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Patient Name"
              icon={User}
              placeholder="e.g. Rahim Uddin"
              error={errors.patient_name?.message}
              {...register('patient_name', { required: 'Patient name is required' })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Blood Group Required</label>
            <select
              className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
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

        {/* Units & Emergency & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Units Needed"
            type="number"
            icon={Activity}
            error={errors.blood_units_needed?.message}
            {...register('blood_units_needed', { required: 'Units count is required', min: { value: 1, message: 'Must be at least 1 unit' } })}
          />

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Emergency level</label>
            <select
              className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
              {...register('emergency_level')}
            >
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Required Date</label>
            <input
              type="date"
              className={`w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 ${errors.required_date ? 'border-red-300' : ''}`}
              {...register('required_date', { required: 'Required date is required', validate: validateRequiredDate })}
            />
            {errors.required_date && <p className="text-xs text-red-500 font-semibold mt-0.5">{errors.required_date.message}</p>}
          </div>
        </div>

        {/* Hospital & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Hospital Name"
            placeholder="e.g. Evercare Hospital"
            icon={Hospital}
            error={errors.hospital_name?.message}
            {...register('hospital_name', { required: 'Hospital name is required' })}
          />
          <Input
            label="Emergency Contact Phone"
            placeholder="e.g. 01712345678"
            icon={Phone}
            error={errors.contact_number?.message}
            {...register('contact_number', {
              required: 'Contact number is required',
              pattern: {
                value: /^(?:\+88|88)?(01[3-9]\d{8})$/,
                message: 'Must be a valid Bangladesh phone number'
              }
            })}
          />
        </div>

        {/* Location selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>

        {/* Additional Notes */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Additional Notes</label>
          <div className="relative">
            <span className="absolute top-3 left-3.5 text-slate-400 pointer-events-none">
              <FileText className="w-5 h-5" />
            </span>
            <textarea
              placeholder="Provide extra details (e.g. ward details, surgery type, matching type)"
              rows="3"
              className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-800 placeholder-slate-400 outline-none focus:border-red-500"
              {...register('additional_notes')}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            icon={Save}
          >
            {isEdit ? 'Save Changes' : 'Publish Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}
