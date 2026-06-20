import api, { buildAuthConfig } from './api';

export const parentService = {
  async getParents(token) {
    const response = await api.get('/parents', buildAuthConfig(token));
    return response.data;
  },

  async createParent(token, data) {
    const response = await api.post('/parents', data, buildAuthConfig(token));
    return response.data;
  },

  async updateParent(token, id, data) {
    const response = await api.put(`/parents/${id}`, data, buildAuthConfig(token));
    return response.data;
  },

  async deactivateParent(token, id) {
    const response = await api.put(`/parents/${id}/deactivate`, {}, buildAuthConfig(token));
    return response.data;
  },

  async deleteParent(token, id) {
    const response = await api.delete(`/parents/${id}`, buildAuthConfig(token));
    return response.data;
  },

  async linkChild(token, accessCode) {
    const response = await api.post('/parents/me/link-child', { accessCode }, buildAuthConfig(token));
    return response.data;
  },

  async unlinkChild(token, studentId) {
    const response = await api.delete(`/parents/me/unlink-child/${studentId}`, buildAuthConfig(token));
    return response.data;
  },

  async requestChild(token, payload) {
    const response = await api.post('/parents/me/child-requests', payload, buildAuthConfig(token));
    return response.data;
  },
};

export default parentService;
