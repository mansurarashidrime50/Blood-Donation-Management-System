import api from '../../services/api';

const patientApi = {
  createRequest: (data) => api.post('/api/v1/patient/requests', data),
  
  getRequests: (skip = 0, limit = 10) => 
    api.get('/api/v1/patient/requests', { params: { skip, limit } }),
    
  getRequest: (id) => api.get(`/api/v1/patient/requests/${id}`),
  
  updateRequest: (id, data) => api.put(`/api/v1/patient/requests/${id}`, data),
  
  deleteRequest: (id) => api.delete(`/api/v1/patient/requests/${id}`),
};

export default patientApi;
