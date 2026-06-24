'use strict';

/**
 * asyncHandler — wraps an async route handler so any rejected promise
 * is forwarded to Express's next(err) instead of crashing the process.
 *
 * Usage:
 *   router.post('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
