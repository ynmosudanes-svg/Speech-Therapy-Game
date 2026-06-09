import api, { buildAuthConfig } from './api';

export const imageService = {
  async searchImages(token, query, provider = 'pexels') {
    const response = await api.get('/images/search', {
      ...buildAuthConfig(token),
      params: { query, provider },
    });
    return response.data;
  },

  async getLibrary(token, params = {}) {
    const response = await api.get('/images/library', {
      ...buildAuthConfig(token),
      params,
    });
    return response.data;
  },

  async saveToLibrary(token, payload) {
    const response = await api.post('/images/library', payload, buildAuthConfig(token));
    return response.data;
  },

  async deleteFromLibrary(token, id) {
    const response = await api.delete(`/images/library/${id}`, buildAuthConfig(token));
    return response.data;
  },

  async getUploadedFiles(token, params = {}) {
    const response = await api.get('/uploads', {
      ...buildAuthConfig(token),
      params,
    });
    return response.data;
  },

  async uploadImageFile(token, file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      ...buildAuthConfig(token),
      headers: {
        ...buildAuthConfig(token).headers,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

export default imageService;
