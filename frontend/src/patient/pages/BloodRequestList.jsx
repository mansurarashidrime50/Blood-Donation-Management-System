import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import usePatientRequests from '../hooks/usePatientRequests';
import BloodRequestCard from '../components/BloodRequestCard';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ErrorComponent from '../components/ErrorComponent';

const ITEMS_PER_PAGE = 10;

export default function BloodRequestList() {
  const { requests, total, loading, error, fetchRequests, deleteRequest } = usePatientRequests();
  const [currentPage, setCurrentPage] = useState(1);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    const skip = (currentPage - 1) * ITEMS_PER_PAGE;
    fetchRequests(skip, ITEMS_PER_PAGE);
  }, [currentPage, fetchRequests]);

  const handleDeleteClick = (request) => {
    setRequestToDelete(request);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRequest(requestToDelete.id);
      setRequestToDelete(null);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
      
      // If we deleted the last item on the page, go back a page
      const totalPages = Math.ceil((total - 1) / ITEMS_PER_PAGE);
      if (currentPage > 1 && currentPage > totalPages) {
        setCurrentPage(totalPages);
      } else {
        // Refetch current page
        const skip = (currentPage - 1) * ITEMS_PER_PAGE;
        fetchRequests(skip, ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Toast Alert Banner */}
        {deleteSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm animate-fade-in shadow-sm">
            <Check className="w-5 h-5" />
            <span className="font-semibold">Blood request successfully deleted!</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">My Blood Requests</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Manage and track your active, fulfilled, or cancelled blood requirements</p>
          </div>
          {requests.length > 0 && (
            <Link
              to="/patient/requests/create"
              className="btn-primary py-2.5 px-5 text-sm flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-5 h-5" />
              Create Request
            </Link>
          )}
        </div>

        {/* Content Body */}
        {loading && requests.length === 0 ? (
          <Loading />
        ) : error ? (
          <ErrorComponent message={error} onRetry={() => fetchRequests((currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE)} />
        ) : requests.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <BloodRequestCard
                key={request.id}
                request={request}
                onDeleteClick={handleDeleteClick}
              />
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 text-sm">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="btn-secondary py-2 px-3 flex items-center gap-1 text-slate-650 disabled:opacity-50 disabled:cursor-not-allowed select-none bg-white border border-slate-200 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-slate-500 font-semibold">
                  Page {currentPage} of {totalPages} <span className="text-xs text-slate-400 font-normal">({total} total requests)</span>
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="btn-secondary py-2 px-3 flex items-center gap-1 text-slate-650 disabled:opacity-50 disabled:cursor-not-allowed select-none bg-white border border-slate-200 rounded-xl"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Delete Dialog */}
        <DeleteConfirmationModal
          isOpen={!!requestToDelete}
          requestName={requestToDelete?.patient_name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setRequestToDelete(null)}
          isLoading={isDeleting}
        />

      </div>
    </div>
  );
}
