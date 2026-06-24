'use strict';

const pool = require('../../config/db');

const VALID_ROLES = ['EMP', 'RM', 'APE', 'CFO'];

/**
 * Find a user by id — returns full row (no password_hash).
 */
async function findById(id) {
  const result = await pool.query(
    'SELECT id, name, email, role, manager_id, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Update a user's role. Returns the updated row.
 */
async function updateRole(userId, role) {
  const result = await pool.query(
    `UPDATE users SET role = $1 WHERE id = $2
     RETURNING id, name, email, role, manager_id, created_at`,
    [role, userId]
  );
  return result.rows[0] || null;
}

module.exports = { findById, updateRole, VALID_ROLES };
