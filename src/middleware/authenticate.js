'use strict';

const repo = require('../modules/auth/auth.repository');
const { UnauthorizedError } = require('../utils/errors');

/**
 * authenticate — reads the signed session cookie, looks up the user in
 * the database, and attaches the full user record to req.user.
 *
 * Returns 401 if:
 *  - the cookie is missing
 *  - the cookie signature is invalid (cookie-parser sets it to `false`)
 *  - the user id in the cookie no longer exists in the database
 */
async function authenticate(req, res, next) {
  try {
    const raw = req.signedCookies && req.signedCookies.session;

    if (!raw) {
      throw new UnauthorizedError('Authentication required — please log in');
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new UnauthorizedError('Malformed session cookie');
    }

    if (!payload || !payload.id) {
      throw new UnauthorizedError('Malformed session cookie');
    }

    const user = await repo.findById(payload.id);
    if (!user) {
      throw new UnauthorizedError('Session user no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
