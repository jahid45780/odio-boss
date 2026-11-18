const ApiError = require('../utils/ApiError');

function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new ApiError(400, result.error.issues[0]?.message || 'Validation error', result.error.issues));
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
