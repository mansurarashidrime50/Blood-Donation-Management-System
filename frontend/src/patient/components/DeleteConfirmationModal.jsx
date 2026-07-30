import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

export default function DeleteConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
  requestName = 'this request'
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      {/* Dark overlay backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onCancel} />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all w-full max-w-md p-6 border border-slate-100 animate-slide-up">
          
          {/* Close button */}
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex gap-4">
            {/* Warning indicator */}
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 leading-6 mb-2">
                Delete Blood Request?
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Are you sure you want to permanently delete the blood request for <strong>{requestName}</strong>? This action cannot be undone and will remove the request from the matching system.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="btn-secondary py-2 px-4 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="btn-danger py-2 px-4 text-sm flex items-center gap-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Yes, Delete Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
