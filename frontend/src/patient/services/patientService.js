import client from '../../shared/api/client';

const patientService = {
  createRequest: (data) => client.post('/patient/requests', data),
  
  getRequests: (params) => client.get('/patient/requests', { params }),
  
  getRequest: (id) => client.get(`/patient/requests/${id}`),
  
  updateRequest: (id, data) => client.put(`/patient/requests/${id}`, data),
  
  deleteRequest: (id) => client.delete(`/patient/requests/${id}`),
  
  getRequestDonations: (id) => client.get(`/patient/requests/${id}/donations`),
  
  updateDonationStatus: (donationId, status) => client.put(`/patient/requests/donations/${donationId}/status`, { status }),

  proposeMeeting: (id, data) => client.post(`/patient/requests/${id}/propose-meeting`, data),

  confirmBloodReceived: (id) => client.post(`/patient/requests/${id}/received`),

  getRequestMeeting: (id) => client.get(`/patient/requests/${id}/meetings`),
};

export default patientService;
