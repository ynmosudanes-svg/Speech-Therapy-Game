import api, { buildAuthConfig } from './api';

export const therapistService = {
  async getTherapists(token) {
    const response = await api.get('/therapists', buildAuthConfig(token));
    return response.data;
  },

  async createTherapist(token, data) {
    const response = await api.post('/therapists', data, buildAuthConfig(token));
    return response.data;
  },

  async updateTherapist(token, id, data) {
    const response = await api.put(`/therapists/${id}`, data, buildAuthConfig(token));
    return response.data;
  },

  async deactivateTherapist(token, id) {
    const response = await api.patch(`/therapists/${id}/deactivate`, {}, buildAuthConfig(token));
    return response.data;
  },

  async deleteTherapist(token, id) {
    const response = await api.delete(`/therapists/${id}`, buildAuthConfig(token));
    return response.data;
  },
};

export default therapistService;
