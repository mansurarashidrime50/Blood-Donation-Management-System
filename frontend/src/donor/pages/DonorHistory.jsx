import React, { useEffect, useState, useCallback } from 'react';
import { Award, Clock, CheckCircle, XCircle } from 'lucide-react';
import donorService from '../services/donorService';
import Table from '../../shared/components/Table';
import Pagination from '../../shared/components/Pagination';
import Button from '../../shared/components/Button';
import Toast from '../../shared/components/Toast';

export default function DonorHistory() {
  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [toast, setToast] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await donorService.getHistory({ skip, limit: itemsPerPage });
      setDonations(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch your donation offers history.");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCancelOffer = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this donation offer?")) return;
    try {
      await donorService.cancelDonation(id);
      setToast({ type: 'success', message: "Successfully cancelled your donation offer." });
      
      // Update local state without full reload
      setDonations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'Cancelled' } : d))
      );
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to cancel donation offer." });
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

  return (
    <div className="space-y-6 animate-slide-up">
      {toast && (
        <div className="fixed top-4 right-4 z-50 min-w-[320px]">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Donation History</h1>
        <p className="text-sm text-slate-500 font-semibold mt-0.5">Logs of all blood donation offers submitted for patients</p>
      </div>

      <Table
        headers={['Patient Name', 'Blood Group', 'Planned Date', 'Status', 'Actions']}
        data={donations}
        isLoading={loading}
        emptyMessage="You have not submitted any donation offers yet."
        renderRow={(d) => (
          <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-6 py-4">
              <div className="font-bold text-slate-800">{d.request?.patient_name || 'N/A'}</div>
              <div className="text-xs text-slate-400 font-semibold mt-0.5">Hospital: {d.request?.hospital_name || 'N/A'}</div>
            </td>
            <td className="px-6 py-4">
              <span className="font-extrabold text-red-600">{d.request?.blood_group_required || 'N/A'}</span>
            </td>
            <td className="px-6 py-4 font-semibold text-slate-655">
              {d.donation_date}
            </td>
            <td className="px-6 py-4">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusStyle(d.status)}`}>
                {d.status}
              </span>
            </td>
            <td className="px-6 py-4">
              {d.status === 'Pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelOffer(d.id)}
                  icon={XCircle}
                  className="text-rose-600 border-rose-100 hover:bg-rose-50"
                >
                  Cancel Offer
                </Button>
              )}
              {d.status !== 'Pending' && (
                <span className="text-xs text-slate-400 font-bold italic">No Actions</span>
              )}
            </td>
          </tr>
        )}
      />

      <Pagination
        currentPage={currentPage}
        totalItems={total}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
        isLoading={loading}
      />
    </div>
  );
}
