'use strict';

const repo = require('./roles.repository');
const { ValidationError, NotFoundError } = require('../../utils/errors');

/**
 * Assign a role to a user.
 *
 * Rules:
 * - userId must exist.
 * - role must be one of the four valid role strings.
 * - Assigning the CFO role is intentionally allowed here so the CFO can
 *   promote another user to CFO if needed (the spec doesn't prohibit it
 *   and says only that the seeded CFO is the initial one). This decision
 *   is documented in the README.
 *
 * @param {number} userId
 * @param {string} role
 */
async function assignRole(userId, role) {
  if (!role || !repo.VALID_ROLES.includes(role)) {
    throw new ValidationError(
      `role must be one of: ${repo.VALID_ROLES.join(', ')}`
    );
  }

  const user = await repo.findById(userId);
  if (!user) {
    throw new NotFoundError(`User with id ${userId} does not exist`);
  }

  const updated = await repo.updateRole(userId, role);
  return updated;
}

module.exports = { assignRole };
