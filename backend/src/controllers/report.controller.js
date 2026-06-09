const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/report.service');

const getStudentReport = asyncHandler(async (req, res) => {
  const report = await reportService.getStudentReport(req.user, req.params.studentId);
  res.json({
    success: true,
    data: report,
  });
});

module.exports = {
  getStudentReport,
};
