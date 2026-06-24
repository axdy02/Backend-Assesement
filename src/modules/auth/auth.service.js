'use strict';

const bcrypt = require('bcrypt');
const repo   = require('./auth.repository');
const { ValidationError, ConflictError, UnauthorizedError } = require('../../utils/errors');

const SALT_ROUNDS = 10;

/**
 * Register a new employee.
 * - Email must end with @org.com (org domain guard).
 * - Duplicate emails return 409.
 * - Password is bcrypt-hashed; plaintext is never stored.
 * - Default role is EMP (enforced by DB default, not here).
 */
async function register({ name, email, password }) {
  if (!name || !email || !password) {
    throw new ValidationError('name, email, and password are required');
  }

  if (!email.endsWith('@org.com')) {
    throw new ValidationError('Email must belong to the @org.com domain');
  }

  const existing = await repo.findByEmail(email);
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await repo.createUser({ name, email, passwordHash });
  return user;
}

/**
 * Validate credentials and return the user.
 *
 * IMPORTANT: wrong-password and unknown-email return the SAME generic
 * message intentionally — we do not reveal which one failed.
 */
async function login({ email, password }) {
  if (!email || !password) {
    throw new ValidationError('email and password are required');
  }

  const user = await repo.findByEmail(email);

  // Always run bcrypt.compare even when user is null to prevent
  // timing-based enumeration of valid emails.
  const dummyHash = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
  const passwordToCheck = user ? user.password_hash : dummyHash;
  const match = await bcrypt.compare(password, passwordToCheck);

  if (!user || !match) {
    throw new UnauthorizedError('Invalid email or password');
  }

  return user;
}

module.exports = { register, login };
