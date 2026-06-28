import api, { buildAuthConfig } from './api';

export const gameService = {
  async getGames(token) {
    const response = await api.get('/games', buildAuthConfig(token));
    return response.data;
  },

  async getGame(token, gameId) {
    const response = await api.get(`/games/${gameId}`, buildAuthConfig(token));
    return response.data;
  },

  async createGame(token, payload) {
    const response = await api.post('/games', payload, buildAuthConfig(token));
    return response.data;
  },

  async updateGame(token, gameId, payload) {
    const response = await api.put(`/games/${gameId}`, payload, buildAuthConfig(token));
    return response.data;
  },

  async deleteGame(token, gameId) {
    const response = await api.delete(`/games/${gameId}`, buildAuthConfig(token));
    return response.data;
  },

  async uploadAsset(token, formData) {
    const response = await api.post('/upload', formData, {
      ...buildAuthConfig(token),
      headers: {
        ...buildAuthConfig(token).headers,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async getUploadedFiles(token, type = '', query = '', category = '', options = {}) {
    const params = { type, query };
    if (options.folderId !== undefined) params.folderId = options.folderId;
    if (options.scope) params.scope = options.scope;
    if (category) params.category = category;

    const response = await api.get('/uploads', {
      ...buildAuthConfig(token),
      params,
    });
    return response.data;
  },

  async deleteUploadedFile(token, key) {
    const response = await api.delete('/uploads', {
      ...buildAuthConfig(token),
      params: { key },
    });
    return response.data;
  },

  async moveUploadedFiles(token, payload) {
    const response = await api.patch('/uploads/move', payload, buildAuthConfig(token));
    return response.data;
  },

  async getMediaFolders(token) {
    const response = await api.get('/media-folders', buildAuthConfig(token));
    return response.data;
  },

  async createMediaFolder(token, payload) {
    const response = await api.post('/media-folders', payload, buildAuthConfig(token));
    return response.data;
  },

  async deleteMediaFolder(token, id) {
    const response = await api.delete(`/media-folders/${encodeURIComponent(id)}`, buildAuthConfig(token));
    return response.data;
  },
};

export default gameService;
