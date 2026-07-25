import api from '../../services/api';

const patientApi = {
  createRequest: (data) => api.post('/patient/requests', data),
  
  getRequests: (skip = 0, limit = 10) => 
    api.get('/patient/requests', { params: { skip, limit } }),
    
  getRequest: (id) => api.get(`/patient/requests/${id}`),
  
  updateRequest: (id, data) => api.put(`/patient/requests/${id}`, data),
  
  deleteRequest: (id) => api.delete(`/patient/requests/${id}`),
};

export default patientApi;
