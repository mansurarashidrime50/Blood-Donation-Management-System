import client from '../../shared/api/client';

const adminService = {
  getStats: () => client.get('/admin/dashboard'),
  
  getUsers: (params) => client.get('/admin/users', { params }),
  
  updateUserStatus: (id, status) => client.put(`/admin/users/${id}/status`, { status }),
  
  getRequests: (params) => client.get('/admin/blood-requests', { params }),
  
  updateRequestStatus: (id, data) => client.put(`/admin/blood-requests/${id}/status`, data),
  
  getDonations: (params) => client.get('/admin/donations', { params }),
  
  updateDonationStatus: (id, data) => client.put(`/admin/donations/${id}/status`, data),

  runEscalation: () => client.post('/admin/run-escalation'),
};

export default adminService;
