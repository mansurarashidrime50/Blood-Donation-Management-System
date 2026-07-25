import client from '../../shared/api/client';

const donorService = {
  getCompatibleRequests: (params) => client.get('/donor/requests', { params }),
  
  getDonationHistory: (params) => client.get('/donor/donations', { params }),
  
  createDonationOffer: (data) => client.post('/donor/donations', data),
  
  cancelDonationOffer: (id) => client.delete(`/donor/donations/${id}`),
};

export default donorService;
