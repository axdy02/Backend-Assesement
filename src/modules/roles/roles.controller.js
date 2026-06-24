'use strict';

const rolesService = require('./roles.service');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * POST /rest/roles/assign
 * Body: { userId, role }
 * CFO-only. Assigns the given role to the target user.
 */
const assignRole = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const user = await rolesService.assignRole(Number(userId), role);
  res.status(200).json({ message: 'Role assigned successfully', user });
});

module.exports = { assignRole };
