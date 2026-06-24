'use strict';

const pool = require('../../config/db');

/**
 * List employees visible to an RM — only their direct reports.
 * Returns users whose manager_id = rmId.
 */
async function listByManager(rmId) {
  const result = await pool.query(
    `SELECT id, name, email, role, manager_id, created_at
     FROM users
     WHERE manager_id = $1
     ORDER BY name`,
    [rmId]
  );
  return result.rows;
}

/**
 * List all EMPs and RMs — visible to APE.
 */
async function listEmpsAndRms() {
  const result = await pool.query(
    `SELECT id, name, email, role, manager_id, created_at
     FROM users
     WHERE role IN ('EMP', 'RM')
     ORDER BY role, name`
  );
  return result.rows;
}

/**
 * List all users — visible to CFO.
 */
async function listAll() {
  const result = await pool.query(
    `SELECT id, name, email, role, manager_id, created_at
     FROM users
     ORDER BY role, name`
  );
  return result.rows;
}

/**
 * Find a single user by id (no password_hash).
 */
async function findById(id) {
  const result = await pool.query(
    'SELECT id, name, email, role, manager_id, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Set manager_id for an EMP (assign EMP → RM).
 */
async function setManager(empId, rmId) {
  const result = await pool.query(
    `UPDATE users SET manager_id = $1 WHERE id = $2
     RETURNING id, name, email, role, manager_id, created_at`,
    [rmId, empId]
  );
  return result.rows[0] || null;
}

/**
 * Clear manager_id for an EMP (unassign EMP from their RM).
 * Only clears if the current manager_id matches rmId — prevents
 * accidentally unlinking a pair that isn't actually linked.
 */
async function clearManager(empId, rmId) {
  const result = await pool.query(
    `UPDATE users SET manager_id = NULL
     WHERE id = $1 AND manager_id = $2
     RETURNING id, name, email, role, manager_id, created_at`,
    [empId, rmId]
  );
  return result.rows[0] || null; // null means the pair wasn't linked
}

module.exports = {
  listByManager,
  listEmpsAndRms,
  listAll,
  findById,
  setManager,
  clearManager,
};
