const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

function validateRequest(req, _res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return next(
    new ApiError(
      422,
      result.array()[0]?.msg || 'Validation failed.',
      result.array().map((issue) => ({
        field: issue.path,
        message: issue.msg,
      }))
    )
  );
}

module.exports = {
  validateRequest,
};
