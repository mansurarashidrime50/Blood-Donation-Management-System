import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import adminService from '../services/adminService';
import Table from '../../shared/components/Table';
import Pagination from '../../shared/components/Pagination';
import Button from '../../shared/components/Button';
import Toast from '../../shared/components/Toast';

export default function RequestManager() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [toast, setToast] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await adminService.getRequests({ skip, limit: itemsPerPage });
      setRequests(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error(err);
      setError("Failed to load blood requests.");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusUpdate = async (req, newStatus) => {
    try {
      await adminService.updateRequestStatus(req.id, { request_status: newStatus });
      setToast({ type: 'success', message: `Request status successfully changed to ${newStatus}.` });
      
      // Update local state without full reload
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, request_status: newStatus } : r))
      );
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to update request status." });
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
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Blood Requests Manager</h1>
        <p className="text-sm text-slate-500 font-semibold mt-0.5">Approve, complete, or cancel blood requests posted by patient accounts</p>
      </div>

      <Table
        headers={['Patient', 'Blood Required', 'Hospital & Location', 'Date Required', 'Status', 'Actions']}
        data={requests}
        isLoading={loading}
        emptyMessage="No blood requests registered in the system."
        renderRow={(req) => (
          <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-6 py-4">
              <div className="font-bold text-slate-850">{req.patient_name}</div>
              <div className="text-xs text-slate-450 mt-0.5">Contact: {req.contact_number}</div>
            </td>
            <td className="px-6 py-4">
              <div className="font-extrabold text-red-600">{req.blood_group_required}</div>
              <div className="text-xs text-slate-400 font-semibold mt-0.5">{req.blood_units_needed} Units</div>
            </td>
            <td className="px-6 py-4 flex flex-col">
              <span className="font-semibold text-slate-700">{req.hospital_name}</span>
              <span className="text-xs text-slate-450 mt-0.5">{req.district}, {req.division}</span>
            </td>
            <td className="px-6 py-4">
              <div className="font-semibold text-slate-655">{req.required_date}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                req.emergency_level === 'Critical' ? 'bg-rose-50 text-rose-700' :
                req.emergency_level === 'Urgent' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {req.emergency_level}
              </span>
            </td>
            <td className="px-6 py-4">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusStyle(req.request_status)}`}>
                {req.request_status}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                {req.request_status === 'Pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusUpdate(req, 'Approved')}
                    icon={CheckCircle}
                  >
                    Approve
                  </Button>
                )}
                {req.request_status !== 'Completed' && req.request_status !== 'Cancelled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(req, 'Cancelled')}
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
