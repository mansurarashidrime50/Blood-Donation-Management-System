import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader } from 'lucide-react';
import usePatientRequests from '../hooks/usePatientRequests';
import BloodRequestForm from '../components/BloodRequestForm';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function EditRequest() {
  const { id } = useParams();
  const { currentRequest, fetchRequest, updateRequest, loading, error } = usePatientRequests();
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const loadRequest = async () => {
      try {
        await fetchRequest(id);
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    };
    loadRequest();
  }, [id, fetchRequest]);

  const onSubmit = async (data) => {
    setFormError(null);
    try {
      await updateRequest(id, data);
      navigate('/patient/requests');
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to update blood request. Please check input parameters.');
    }
  };

  if (isFetching) {
    return (
      <div className="flex-1 py-16 flex items-center justify-center">
        <LoadingSpinner fullPage={false} />
      </div>
    );
  }

  if (!currentRequest && error) {
    return (
      <div className="flex-1 py-10 px-4 max-w-3xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-650 mx-auto" />
          <h2 className="text-lg font-bold">Failed to load blood request</h2>
          <p className="text-sm font-medium">{error}</p>
          <Link to="/patient/requests" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-650 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
        
        {/* Navigation Link */}
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
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Edit Blood Request</h1>
            <p className="text-sm text-slate-500 font-medium">Update emergency parameters, date, location details, or status</p>
          </div>

          {/* Error Alert */}
          {(formError || error) && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error Updating Request:</span>
                <p className="mt-0.5">{formError || error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          {currentRequest && (
            <BloodRequestForm
              initialData={currentRequest}
              onSubmit={onSubmit}
              isLoading={loading}
              isEdit={true}
            />
          )}
        </div>

      </div>
    </div>
  );
}
