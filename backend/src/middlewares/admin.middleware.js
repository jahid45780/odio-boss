const ApiError = require('../utils/ApiError');

function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new ApiError(403, 'Administrator privileges required.'));
  }
  next();
}

module.exports = { requireAdmin };
