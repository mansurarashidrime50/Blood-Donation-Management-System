import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';
import ConfirmationModal from '../components/ConfirmationModal';
import { Calendar, User, Shield, Key, Camera, Check, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile, updateProfileImage, deleteAccount } = useAuth();
  const navigate = useNavigate();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  if (!user) {
    return (
      <div className="flex-1 py-16 flex items-center justify-center">
        <p className="text-slate-500 font-semibold">Redirecting to login...</p>
      </div>
    );
  }

  const handleToggleAvailability = async () => {
    try {
      setUpdateSuccess(false);
      await updateProfile({ availability: !user.availability });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side image validation
    if (!file.type.startsWith('image/')) {
      setImageError('Selected file must be an image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setImageError('Image size must be smaller than 2MB.');
      return;
    }

    setIsUploading(true);
    setImageError(null);
    try {
      await updateProfileImage(file);
    } catch (err) {
      console.error(err);
      setImageError(err.response?.data?.detail || 'Failed to upload profile image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to delete account. Please try again.');
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatJoinedDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Dynamic Update Alert Banner */}
        {updateSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm animate-fade-in">
            <Check className="w-5 h-5" />
            <span className="font-semibold">Availability status updated successfully!</span>
          </div>
        )}

        {/* Dashboard Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Donor Dashboard</h1>
            <p className="text-sm text-slate-500 font-medium">Manage your blood donation availability and profile data</p>
          </div>
          <button
            onClick={handleToggleAvailability}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm ${
              user.availability
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-blood-500 text-white hover:bg-blood-600'
            }`}
          >
            {user.availability ? 'Set as Unavailable' : 'Set as Available Now'}
          </button>
        </div>

        {/* Profile Card component */}
        <ProfileCard
          donor={user}
          isPrivate={true}
          onEdit={() => navigate('/profile/edit')}
          onDelete={() => setIsDeleteModalOpen(true)}
        />

        {/* Info grids */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Detailed Specifications column */}
          <div className="md:col-span-8 space-y-6">
            <div className="glass-card p-6 bg-white shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-2">
                Detailed Donor Record
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Gender</span>
                  <p className="text-slate-700 font-semibold mt-0.5">{user.gender || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Date of Birth</span>
                  <p className="text-slate-700 font-semibold mt-0.5">{user.dob || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Registered Email</span>
                  <p className="text-slate-700 font-semibold mt-0.5">{user.email}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Member Since</span>
                  <p className="text-slate-700 font-semibold mt-0.5">{formatJoinedDate(user.created_at)}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Full Geolocation Address</span>
                  <p className="text-slate-700 font-semibold mt-0.5">
                    {user.address}, {user.area}, {user.district}, {user.division}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions / Avatar Change sidebar column */}
          <div className="md:col-span-4 space-y-6">
            <div className="glass-card p-6 bg-white shadow-sm text-center space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-left border-b border-slate-50 pb-2">
                Profile Avatar
              </h3>

              {imageError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-1.5 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{imageError}</span>
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <label className="relative cursor-pointer group flex flex-col items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <div className="w-20 h-20 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all overflow-hidden relative">
                    {isUploading ? (
                      <span className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    ) : user.profile_image ? (
                      <>
                        <img
                          src={user.profile_image.startsWith('/') ? `http://localhost:8000${user.profile_image}` : user.profile_image}
                          alt={user.full_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Camera className="w-5 h-5" />
                        </div>
                      </>
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-500 hover:text-blood-500 transition-colors mt-2">
                    {isUploading ? 'Uploading...' : 'Change Image'}
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 leading-normal">
                  JPG, WebP, or PNG. Maximum 2MB size.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          title="Delete Donor Account?"
          message="This action is permanent and will completely purge your donor registration records. You will no longer receive match notifications."
          confirmText="Yes, Delete My Account"
          cancelText="No, Keep Profile"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsDeleteModalOpen(false)}
          isLoading={isDeleting}
        />

      </div>
    </div>
  );
}
