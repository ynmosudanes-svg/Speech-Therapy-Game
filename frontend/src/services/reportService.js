import api, { buildAuthConfig } from './api';

export const reportService = {
  async getStudentReport(token, studentId) {
    const response = await api.get(`/reports/${studentId}`, buildAuthConfig(token));
    return response.data;
  },
};

export default reportService;
