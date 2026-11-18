const ApiError = require('../utils/ApiError');

function errorHandler(err, _req, res, _next) {
  const statusCode = err instanceof ApiError ? err.statusCode : err.name === 'ValidationError' ? 400 : 500;
  const message = err.code === 11000 ? 'Duplicate unique field value.' : err.message || 'Internal server error';
  res.status(statusCode).json({
    success: false,
    message,
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { errorHandler };
