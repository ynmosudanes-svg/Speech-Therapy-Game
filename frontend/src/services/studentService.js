import api, { buildAuthConfig } from './api';

export const studentService = {
  async getStudents(token) {
    const response = await api.get('/students', buildAuthConfig(token));
    return response.data;
  },

  async createStudent(token, payload) {
    const response = await api.post('/students', payload, buildAuthConfig(token));
    return response.data;
  },

  async updateStudent(token, studentId, payload) {
    const response = await api.put(`/students/${studentId}`, payload, buildAuthConfig(token));
    return response.data;
  },

  async deleteStudent(token, studentId) {
    const response = await api.delete(`/students/${studentId}`, buildAuthConfig(token));
    return response.data;
  },

  async regenerateAccessCode(token, studentId) {
    const response = await api.patch(`/students/${studentId}/access-code`, {}, buildAuthConfig(token));
    return response.data;
  },
};

export default studentService;
