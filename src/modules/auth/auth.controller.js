'use strict';

const authService  = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * POST /rest/onboardings/register
 * Body: { name, email, password }
 * Creates a new EMP account. Returns the created user (no password_hash).
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.register({ name, email, password });
  res.status(201).json({ message: 'Account created successfully', user });
});

/**
 * POST /rest/onboardings/login
 * Body: { email, password }
 * On success, issues a signed cookie containing the session payload.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.login({ email, password });

  // Store minimal user info in the signed cookie.
  // The cookie is signed with SESSION_SECRET via cookie-parser.
  const sessionPayload = JSON.stringify({ id: user.id, role: user.role });
  res.cookie('session', sessionPayload, {
    signed:   true,
    httpOnly: true,
    sameSite: 'lax',
    // maxAge: 8 hours in ms — reasonable working-day session length
    maxAge: 8 * 60 * 60 * 1000,
  });

  // Return user info (minus password_hash) for convenience
  const { password_hash, ...safeUser } = user;
  res.status(200).json({ message: 'Login successful', user: safeUser });
});

/**
 * POST /rest/onboardings/logout
 * Clears the session cookie.
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('session');
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = { register, login, logout };
