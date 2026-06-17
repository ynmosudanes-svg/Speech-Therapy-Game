const asyncHandler = require('../utils/asyncHandler');
const parentService = require('../services/parent.service');

const createParent = asyncHandler(async (req, res) => {
  const parent = await parentService.createParent(req.body);
  res.status(201).json({
    success: true,
    message: 'Parent created successfully.',
    data: parent,
  });
});

const getParents = asyncHandler(async (_req, res) => {
  const parents = await parentService.listParents();
  res.json({
    success: true,
    count: parents.length,
    data: parents,
  });
});

const updateParent = asyncHandler(async (req, res) => {
  const parent = await parentService.updateParent(req.params.id, req.body);
  res.json({
    success: true,
    message: 'Parent updated successfully.',
    data: parent,
  });
});

const deactivateParent = asyncHandler(async (req, res) => {
  const parent = await parentService.deactivateParent(req.params.id);
  res.json({
    success: true,
    message: 'Parent deactivated successfully.',
    data: parent,
  });
});

const deleteParent = asyncHandler(async (req, res) => {
  await parentService.deleteParent(req.params.id);
  res.json({
    success: true,
    message: 'Parent deleted successfully.',
  });
});

const linkChild = asyncHandler(async (req, res) => {
  const student = await parentService.linkChildByAccessCode(req.user, req.body.accessCode);
  res.json({
    success: true,
    message: 'Child linked successfully.',
    data: student,
  });
});

const requestChild = asyncHandler(async (req, res) => {
  const student = await parentService.requestChild(req.user, req.body);
  res.status(201).json({
    success: true,
    message: 'Child request submitted successfully.',
    data: student,
  });
});

module.exports = {
  createParent,
  getParents,
  updateParent,
  deactivateParent,
  deleteParent,
  linkChild,
  requestChild,
};
