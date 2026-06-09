import api from './api';

export const authService = {
  async loginTherapist(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async loginStudent(accessCode) {
    const response = await api.post('/student/login', { accessCode });
    return response.data;
  },

  async loginPatient(accessCode) {
    const response = await api.post('/patient/login', { accessCode });
    return response.data;
  },
};

export default authService;
