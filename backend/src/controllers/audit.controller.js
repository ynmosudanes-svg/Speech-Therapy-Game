const asyncHandler = require('../utils/asyncHandler');
const auditService = require('../services/audit.service');

const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await auditService.listActivityLogs(req.query);
  res.json({
    success: true,
    count: logs.length,
    data: logs,
  });
});

module.exports = {
  getAuditLogs,
};