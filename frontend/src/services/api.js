import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hasAuthHeader =
      Boolean(error?.config?.headers?.Authorization) ||
      Boolean(error?.config?.headers?.authorization);

    if (error?.response?.status === 401 && hasAuthHeader && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('therapy:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export const buildAuthConfig = (token) =>
  token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};

export default api;
