const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const User = require('../user/user.model');
const ApiError = require('../../utils/ApiError');

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

async function registerCustomer(payload) {
  const exists = await User.findOne({ email: payload.email });
  if (exists) throw new ApiError(409, 'Email is already registered.');

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    name: payload.name,
    email: payload.email,
    passwordHash,
    phone: payload.phone || '',
    role: 'CUSTOMER',
  });

  const token = issueToken(user);
  return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, 'Invalid email or password.');
  if (user.isBlocked) throw new ApiError(403, 'Account is suspended.');

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new ApiError(401, 'Invalid email or password.');

  const token = issueToken(user);
  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, addresses: user.addresses },
    token,
  };
}

module.exports = { registerCustomer, loginUser };
