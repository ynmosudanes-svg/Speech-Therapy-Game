const ApiError = require('../utils/apiError');
const { verifyToken } = require('../utils/jwt');
const { normalizeRole } = require('../utils/roles');

function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication token is required.'));
  }

  try {
    req.user = verifyToken(token);
    req.user.role = normalizeRole(req.user.role);
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired authentication token.'));
  }
}

function optionalAuthenticate(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (!authHeader || !token) {
    return next();
  }

  if (scheme !== 'Bearer') {
    return next(new ApiError(401, 'Invalid authentication scheme.'));
  }

  try {
    req.user = verifyToken(token);
    req.user.role = normalizeRole(req.user.role);
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired authentication token.'));
  }
}
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication is required.'));
    }

    const allowedRoles = roles.map(normalizeRole);

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }

    return next();
  };
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
};
