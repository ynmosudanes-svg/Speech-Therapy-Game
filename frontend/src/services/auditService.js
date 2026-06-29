import api, { buildAuthConfig } from './api';

export const auditService = {
  async getAuditLogs(token, params = {}) {
    const response = await api.get('/audit-logs', {
      ...buildAuthConfig(token),
      params,
    });
    return response.data;
  },
};

export default auditService;