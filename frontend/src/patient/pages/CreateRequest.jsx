import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import usePatientRequests from '../hooks/usePatientRequests';
import BloodRequestForm from '../components/BloodRequestForm';

export default function CreateRequest() {
  const { createRequest, loading, error } = usePatientRequests();
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);

  const onSubmit = async (data) => {
    setFormError(null);
    try {
      await createRequest(data);
      // Success redirect to list page
      navigate('/patient/requests');
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to create blood request. Please check input parameters.');
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
        
        {/* Navigation Breadcrumb Link */}
        <div className="flex items-center gap-2">
          <Link
            to="/patient/requests"
            className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
        </div>

        {/* Card Form Wrapper */}
        <div className="glass-card p-8 bg-white shadow-sm border border-slate-100 rounded-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Create New Blood Request</h1>
            <p className="text-sm text-slate-500 font-medium">Post a request detailing patient vitals, emergency needs, and hospital location</p>
          </div>

          {/* Form Level Error Alert */}
          {(formError || error) && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error Posting Request:</span>
                <p className="mt-0.5">{formError || error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <BloodRequestForm
            onSubmit={onSubmit}
            isLoading={loading}
            isEdit={false}
          />
        </div>

      </div>
    </div>
  );
}
