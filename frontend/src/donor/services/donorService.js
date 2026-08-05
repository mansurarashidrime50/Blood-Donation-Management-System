import client from '../../shared/api/client';

const donorService = {
  getCompatibleRequests: (params) => client.get('/donor/requests', { params }),
  
  getHistory: (params) => client.get('/donor/donations', { params }),
  
  acceptRequest: (requestId) => client.post('/donor/donations', { request_id: requestId }),
  
  confirmMeeting: (requestId) => client.post(`/donor/requests/${requestId}/confirm-meeting`),
  
  completeDonation: (requestId) => client.post(`/donor/requests/${requestId}/completed`),
  
  cancelDonation: (donationId) => client.delete(`/donor/donations/${donationId}`),

  getRequest: (id) => client.get(`/donor/requests/${id}`),

  declineRequest: (requestId) => client.post(`/donor/requests/${requestId}/decline`),
};

export default donorService;
