'use strict';

const { ForbiddenError } = require('../utils/errors');

/**
 * authorize — role-based guard middleware factory.
 *
 * Usage:
 *   router.post('/path', authenticate, authorize(['CFO']), handler);
 *
 * The middleware reads req.user (set by authenticate) and checks whether
 * the user's role is in the allowed list.  Adding a new role to a route
 * is a one-line config change here — no branching logic in route files.
 *
 * @param {string[]} allowedRoles - Array of permitted role strings.
 */
function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      // Should not happen if authenticate runs first, but guard anyway.
      return next(new ForbiddenError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to perform this action')
      );
    }

    next();
  };
}

module.exports = authorize;
