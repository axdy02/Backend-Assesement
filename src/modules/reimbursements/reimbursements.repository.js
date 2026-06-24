'use strict';

const pool = require('../../config/db');

/**
 * Insert a new reimbursement. All three statuses default to PENDING (DB default).
 * Returns the full created row.
 */
async function createReimbursement({ empId, title, description, amount }) {
  const result = await pool.query(
    `INSERT INTO reimbursements (emp_id, title, description, amount)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [empId, title, description, amount]
  );
  return result.rows[0];
}

/**
 * Find a reimbursement by id. Returns the full row.
 */
async function findById(id) {
  const result = await pool.query(
    'SELECT * FROM reimbursements WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Update rm_status for a reimbursement. Returns the updated row.
 */
async function updateRmStatus(id, status) {
  const result = await pool.query(
    `UPDATE reimbursements
     SET rm_status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
}

/**
 * Update ape_status (and record which APE acted) for a reimbursement.
 * Returns the updated row.
 */
async function updateApeStatus(id, status, apeId) {
  const result = await pool.query(
    `UPDATE reimbursements
     SET ape_status = $1, ape_id = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, apeId, id]
  );
  return result.rows[0] || null;
}

/**
 * Update cfo_status for a reimbursement. Returns the updated row.
 */
async function updateCfoStatus(id, status) {
  const result = await pool.query(
    `UPDATE reimbursements
     SET cfo_status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
}

/**
 * Fetch the emp row for a reimbursement (needed by RM to check manager_id).
 */
async function findEmpByReimbursementId(reimbursementId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.manager_id
     FROM reimbursements r
     JOIN users u ON u.id = r.emp_id
     WHERE r.id = $1`,
    [reimbursementId]
  );
  return result.rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// List queries — one per visibility rule from spec section 1
// ─────────────────────────────────────────────────────────────────────────────

/**
 * EMP: see only their own reimbursements.
 */
async function listForEmp(empId) {
  const result = await pool.query(
    `SELECT * FROM reimbursements WHERE emp_id = $1 ORDER BY created_at DESC`,
    [empId]
  );
  return result.rows;
}

/**
 * RM: see claims from their direct reports that are still PENDING at RM stage.
 * Joins users so we can filter by manager_id.
 */
async function listForRm(rmId) {
  const result = await pool.query(
    `SELECT r.*
     FROM reimbursements r
     JOIN users u ON u.id = r.emp_id
     WHERE u.manager_id = $1
       AND r.rm_status = 'PENDING'
     ORDER BY r.created_at DESC`,
    [rmId]
  );
  return result.rows;
}

/**
 * APE: see claims that have been approved by an RM but are still pending at APE stage.
 */
async function listForApe() {
  const result = await pool.query(
    `SELECT * FROM reimbursements
     WHERE rm_status = 'APPROVED' AND ape_status = 'PENDING'
     ORDER BY created_at DESC`
  );
  return result.rows;
}

/**
 * CFO: see all claims that have been approved by an APE (downstream audit view).
 */
async function listForCfo() {
  const result = await pool.query(
    `SELECT * FROM reimbursements
     WHERE ape_status = 'APPROVED'
     ORDER BY created_at DESC`
  );
  return result.rows;
}

/**
 * List all reimbursements for a specific user (by emp_id).
 * Used by RM to view a subordinate's full history.
 */
async function listByEmpId(empId) {
  const result = await pool.query(
    `SELECT * FROM reimbursements WHERE emp_id = $1 ORDER BY created_at DESC`,
    [empId]
  );
  return result.rows;
}

/**
 * Find a user by id (no password_hash) — needed for /reimbursements/:userId validation.
 */
async function findUserById(userId) {
  const result = await pool.query(
    'SELECT id, name, email, role, manager_id FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

module.exports = {
  createReimbursement,
  findById,
  updateRmStatus,
  updateApeStatus,
  updateCfoStatus,
  findEmpByReimbursementId,
  listForEmp,
  listForRm,
  listForApe,
  listForCfo,
  listByEmpId,
  findUserById,
};

