import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, ShieldAlert, UserX, UserCheck, Search, Filter } from 'lucide-react';
import adminService from '../services/adminService';
import Table from '../../shared/components/Table';
import Pagination from '../../shared/components/Pagination';
import SearchBox from '../../shared/components/SearchBox';
import Button from '../../shared/components/Button';
import Toast from '../../shared/components/Toast';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Toast notifications
  const [toast, setToast] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const params = {
        skip,
        limit: itemsPerPage,
      };
      if (search) params.search = search;
      if (role) params.role = role;
      if (statusFilter) params.status = statusFilter;

      const response = await adminService.getUsers(params);
      setUsers(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error(err);
      setError("Failed to load user accounts list.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, role, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (user, newStatus) => {
    try {
      await adminService.updateUserStatus(user.id, newStatus);
      setToast({ type: 'success', message: `Successfully updated ${user.full_name}'s status to ${newStatus}.` });
      
      // Update local state without full reload
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.response?.data?.detail || "Failed to update account status." });
    }
  };

  const handleSearch = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 min-w-[320px]">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Users Manager</h1>
        <p className="text-sm text-slate-500 font-semibold mt-0.5">Activate, ban, or inspect registered user profiles across modules</p>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
        <SearchBox placeholder="Search name, email, phone..." onSearch={handleSearch} />
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Role Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={role}
              onChange={handleRoleChange}
              className="w-full text-xs font-bold uppercase tracking-wider text-slate-550 border border-slate-200 bg-white rounded-xl py-2.5 px-4 outline-none focus:border-red-500"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="DONOR">DONOR</option>
              <option value="PATIENT">PATIENT</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full text-xs font-bold uppercase tracking-wider text-slate-550 border border-slate-200 bg-white rounded-xl py-2.5 px-4 outline-none focus:border-red-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="BANNED">BANNED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <Table
        headers={['Name', 'Email & Phone', 'Role', 'Status', 'Actions']}
        data={users}
        isLoading={loading}
        emptyMessage="No registered accounts match the filters."
        renderRow={(u) => (
          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-6 py-4">
              <div className="font-bold text-slate-800">{u.full_name}</div>
              <span className="text-[10px] text-slate-400 font-semibold">{u.uuid.substring(0, 8)}...</span>
            </td>
            <td className="px-6 py-4">
              <div className="font-semibold text-slate-700">{u.email}</div>
              <div className="text-xs text-slate-450 mt-0.5">{u.phone}</div>
            </td>
            <td className="px-6 py-4">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-650' :
                u.role === 'DONOR' ? 'bg-red-50 text-red-650' : 'bg-amber-50 text-amber-650'
              }`}>
                {u.role}
              </span>
            </td>
            <td className="px-6 py-4">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {u.status}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                {u.status === 'ACTIVE' ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleStatusChange(u, 'BANNED')}
                    icon={UserX}
                  >
                    Ban Account
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusChange(u, 'ACTIVE')}
                    icon={UserCheck}
                    className="text-emerald-600 hover:bg-emerald-50"
                  >
                    Activate
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      {/* Pagination Controls */}
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
