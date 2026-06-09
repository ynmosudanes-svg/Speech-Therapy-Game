const asyncHandler = require('../utils/asyncHandler');
const studentService = require('../services/student.service');

const getStudents = asyncHandler(async (req, res) => {
  const students = await studentService.listStudents(req.user);
  res.json({
    success: true,
    count: students.length,
    data: students,
  });
});

const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.user, req.body);
  res.status(201).json({
    success: true,
    message: 'Student created successfully.',
    data: student,
  });
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.user, req.params.id, req.body);
  res.json({
    success: true,
    message: 'Student updated successfully.',
    data: student,
  });
});

const deleteStudent = asyncHandler(async (req, res) => {
  await studentService.deleteStudent(req.user, req.params.id);
  res.json({
    success: true,
    message: 'Student deleted successfully.',
  });
});

const regenerateAccessCode = asyncHandler(async (req, res) => {
  const data = await studentService.regenerateAccessCode(req.user, req.params.id);
  res.json({
    success: true,
    message: 'Access code regenerated successfully.',
    data,
  });
});

module.exports = {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  regenerateAccessCode,
};
