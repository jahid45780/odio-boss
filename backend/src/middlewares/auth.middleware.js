const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const User = require('../modules/user/user.model');

async function authenticate(req, _res, next) {
  try {
    const token = req.cookies?.soniq_token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new ApiError(401, 'Authentication required.');
    }
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.sub).select('-passwordHash');
    if (!user || user.isBlocked) {
      throw new ApiError(401, 'Invalid or suspended user session.');
    }
    req.user = user;
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(401, 'Authentication failed.'));
  }
}

async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.soniq_token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.sub).select('-passwordHash');
      if (user && !user.isBlocked) req.user = user;
    }
  } catch {
    // ignore optional auth failure
  }
  next();
}

module.exports = { authenticate, optionalAuth };
