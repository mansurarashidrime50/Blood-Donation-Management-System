import React, { useEffect, useState, useCallback } from 'react';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import adminService from '../services/adminService';
import Table from '../../shared/components/Table';
import Pagination from '../../shared/components/Pagination';
import Button from '../../shared/components/Button';
import Toast from '../../shared/components/Toast';

export default function DonationManager() {
  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [toast, setToast] = useState(null);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await adminService.getDonations({ skip, limit: itemsPerPage });
      setDonations(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error(err);
      setError("Failed to load donation records log.");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleStatusUpdate = async (donation, newStatus) => {
    try {
      await adminService.updateDonationStatus(donation.id, { status: newStatus });
      setToast({ type: 'success', message: `Donation offer successfully marked as ${newStatus}.` });
      
      // Update local state without full reload
      setDonations((prev) =>
        prev.map((d) => (d.id === donation.id ? { ...d, status: newStatus } : d))
      );
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to update donation status." });
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      Pending: 'bg-amber-50 text-amber-700',
      Approved: 'bg-sky-50 text-sky-700',
      Completed: 'bg-emerald-50 text-emerald-700',
      Cancelled: 'bg-slate-105 text-slate-500',
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
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Donations Log</h1>
        <p className="text-sm text-slate-500 font-semibold mt-0.5">Oversight and status logs for all donor-patient donation offers</p>
      </div>

      <Table
        headers={['Donor Name', 'Patient Target', 'Donation Date', 'Status', 'Actions']}
        data={donations}
        isLoading={loading}
        emptyMessage="No donation offers recorded in the system yet."
        renderRow={(d) => (
          <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-6 py-4">
              <div className="font-bold text-slate-850">{d.donor?.full_name || 'System Donor'}</div>
              <div className="text-xs text-slate-400 font-semibold mt-0.5">Blood Group: {d.donor?.blood_group || 'N/A'}</div>
            </td>
            <td className="px-6 py-4">
              <div className="font-semibold text-slate-750">{d.request?.patient_name || 'N/A'}</div>
              <div className="text-xs text-slate-450 mt-0.5">Required Group: {d.request?.blood_group_required || 'N/A'}</div>
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
              <div className="flex items-center gap-2">
                {d.status === 'Pending' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusUpdate(d, 'Approved')}
                    icon={CheckCircle}
                    className="text-sky-600 hover:bg-sky-50"
                  >
                    Approve
                  </Button>
                )}
                {d.status === 'Approved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusUpdate(d, 'Completed')}
                    icon={Award}
                  >
                    Complete
                  </Button>
                )}
                {d.status !== 'Completed' && d.status !== 'Cancelled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(d, 'Cancelled')}
                    icon={XCircle}
                    className="text-rose-650 border-rose-100 hover:bg-rose-50"
                  >
                    Cancel
                  </Button>
                )}
              </div>
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
