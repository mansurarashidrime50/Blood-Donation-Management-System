import client from '../api/client';

const sharedService = {
  getNotifications: (params) => client.get('/notifications', { params }),
  
  markNotificationRead: (id) => client.put(`/notifications/${id}/read`),
  
  markAllNotificationsRead: () => client.put('/notifications/read-all'),
  
  getConversations: () => client.get('/chat/conversations'),
  
  getConversationDetails: (id) => client.get(`/chat/conversations/${id}`),
  
  startChat: (reqId, donorId) => client.post('/chat/start', null, { params: { req_id: reqId, donor_id: donorId } }),
  
  sendMessage: (data) => client.post('/chat/messages', msgDataMapping(data)),
  
  logCall: (data) => client.post('/communication/calls', data),
  
  logCommunication: (data) => client.post('/communication/logs', data),
  
  getCommunicationLogs: (requestId) => client.get('/communication/logs', { params: { request_id: requestId } }),
};

// Simple mapping helper for client messaging parameters
function msgDataMapping(data) {
  return {
    conversation_id: data.conversationId || data.conversation_id,
    content: data.content
  };
}

export default sharedService;
