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

module.exports = {
  createReimbursement,
  findById,
  updateRmStatus,
  updateApeStatus,
  updateCfoStatus,
  findEmpByReimbursementId,
};
