import api, { buildAuthConfig } from './api';

export const sessionService = {
  async createSession(token, payload) {
    const response = await api.post('/sessions', payload, buildAuthConfig(token));
    return response.data;
  },

  async getSessions(token) {
    const response = await api.get('/sessions', buildAuthConfig(token));
    return response.data;
  },

  async getSessionsByStudent(token, studentId) {
    const response = await api.get(`/sessions/student/${studentId}`, buildAuthConfig(token));
    return response.data;
  },
};

export default sessionService;
