import api, { buildAuthConfig } from './api';

export const gameLibraryService = {
  async getLibraries(token) {
    const response = await api.get('/game-libraries', buildAuthConfig(token));
    return response.data;
  },

  async getLibrary(token, libraryId) {
    const response = await api.get(`/game-libraries/${libraryId}`, buildAuthConfig(token));
    return response.data;
  },

  async createLibrary(token, payload) {
    const response = await api.post('/game-libraries', payload, buildAuthConfig(token));
    return response.data;
  },

  async updateLibrary(token, libraryId, payload) {
    const response = await api.put(`/game-libraries/${libraryId}`, payload, buildAuthConfig(token));
    return response.data;
  },

  async deleteLibrary(token, libraryId) {
    const response = await api.delete(`/game-libraries/${libraryId}`, buildAuthConfig(token));
    return response.data;
  },
};

export default gameLibraryService;
