const config = require('../../config');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const authService = require('./auth.service');

function setCookie(res, token) {
  res.cookie('soniq_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

const register = catchAsync(async (req, res) => {
  const { user, token } = await authService.registerCustomer(req.body);
  setCookie(res, token);
  sendResponse(res, 201, { user }, 'Account created');
});

const login = catchAsync(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);
  setCookie(res, token);
  sendResponse(res, 200, { user }, 'Authenticated');
});

const logout = catchAsync(async (_req, res) => {
  res.clearCookie('soniq_token');
  sendResponse(res, 200, { loggedOut: true });
});

const me = catchAsync(async (req, res) => {
  sendResponse(res, 200, { user: req.user });
});

module.exports = { register, login, logout, me };
