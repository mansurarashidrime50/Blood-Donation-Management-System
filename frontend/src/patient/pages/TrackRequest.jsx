import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, Clock, CheckCircle, XCircle, ArrowLeft, Heart, User, MapPin } from 'lucide-react';
import patientService from '../services/patientService';
import Loader from '../../shared/components/Loader';
import Table from '../../shared/components/Table';
import Button from '../../shared/components/Button';
import Toast from '../../shared/components/Toast';

export default function TrackRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [toast, setToast] = useState(null);

  const fetchRequestDetailsAndOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, offersRes] = await Promise.all([
        patientService.getRequest(id),
        patientService.getRequestDonations(id)
      ]);
      setRequest(reqRes.data);
      setOffers(offersRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch blood request details and matching offers.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequestDetailsAndOffers();
  }, [fetchRequestDetailsAndOffers]);

  const handleUpdateStatus = async (offer, newStatus) => {
    try {
      await patientService.updateDonationStatus(offer.id, newStatus);
      setToast({ type: 'success', message: `Donation offer successfully changed to ${newStatus}.` });
      fetchRequestDetailsAndOffers(); // Refetch to sync status updates
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to update offer status." });
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      Pending: 'bg-amber-50 text-amber-700',
      Approved: 'bg-sky-50 text-sky-700',
      Completed: 'bg-emerald-50 text-emerald-700',
      Cancelled: 'bg-slate-100 text-slate-500',
    };
    return styles[status] || 'bg-slate-50 text-slate-600';
  };

  if (loading) return <Loader text="Retrieving offer records..." />;
  if (error) return <div className="text-red-500 text-center py-12 font-bold">{error}</div>;
  if (!request) return null;

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

      {/* Header Toolbar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/patient/dashboard')}
          className="p-2 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Track Request</h1>
          <p className="text-sm text-slate-500 font-semibold mt-0.5">Oversight matching donor donation offers for this request</p>
        </div>
      </div>

      {/* Blood Request Info Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Request Details</span>
            <h3 className="text-xl font-bold text-slate-800">For Patient: {request.patient_name}</h3>
            <span className="text-xs text-slate-550 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {request.hospital_name}, {request.district}, {request.division}
            </span>
          </div>
          <span className="text-xl font-black text-red-600 bg-red-50 py-1.5 px-4 rounded-full border border-red-100">
            {request.blood_group_required}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
          <div>
            <div className="font-bold text-slate-400 uppercase mb-0.5">Units Needed</div>
            <span className="text-sm font-bold text-slate-800">{request.blood_units_needed} Units</span>
          </div>
          <div>
            <div className="font-bold text-slate-400 uppercase mb-0.5">Required Date</div>
            <span className="text-sm font-bold text-slate-800">{request.required_date}</span>
          </div>
          <div>
            <div className="font-bold text-slate-400 uppercase mb-0.5">Emergency Level</div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
              request.emergency_level === 'Critical' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
            }`}>{request.emergency_level}</span>
          </div>
          <div>
            <div className="font-bold text-slate-400 uppercase mb-0.5">Request Status</div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${getStatusStyle(request.request_status)}`}>
              {request.request_status}
            </span>
          </div>
        </div>
      </div>

      {/* Donation Offers Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-800">Donation Offers Received</h2>
        
        <Table
          headers={['Donor Name', 'Contact Phone', 'Planned Date', 'Status', 'Actions']}
          data={offers}
          emptyMessage="No donors have offered blood donations for this request yet."
          renderRow={(offer) => (
            <tr key={offer.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-bold text-slate-850">{offer.donor?.full_name || 'Anonymous Donor'}</div>
                <div className="text-xs text-slate-450 mt-0.5">Gender: {offer.donor?.gender || 'N/A'} | Weight: {offer.donor?.weight ? `${offer.donor.weight} kg` : 'N/A'}</div>
              </td>
              <td className="px-6 py-4">
                {offer.status === 'Approved' || offer.status === 'Completed' ? (
                  <a href={`tel:${offer.donor?.phone}`} className="text-slate-800 font-semibold hover:text-red-650 hover:underline">
                    {offer.donor?.phone}
                  </a>
                ) : (
                  <span className="text-xs text-slate-450 italic font-semibold">Contact hidden until approved</span>
                )}
              </td>
              <td className="px-6 py-4 font-semibold text-slate-655">
                {offer.donation_date}
              </td>
              <td className="px-6 py-4">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusStyle(offer.status)}`}>
                  {offer.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {offer.status === 'Pending' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(offer, 'Approved')}
                      icon={CheckCircle}
                    >
                      Approve Offer
                    </Button>
                  )}
                  {offer.status === 'Approved' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStatus(offer, 'Completed')}
                      icon={Award}
                      className="text-emerald-600 hover:bg-emerald-50"
                    >
                      Complete Donation
                    </Button>
                  )}
                  {offer.status !== 'Completed' && offer.status !== 'Cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(offer, 'Cancelled')}
                      icon={XCircle}
                      className="text-rose-600 border-rose-100 hover:bg-rose-50"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}
