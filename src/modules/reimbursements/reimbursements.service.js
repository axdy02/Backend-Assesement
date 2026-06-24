'use strict';

const repo = require('./reimbursements.repository');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../utils/errors');

const VALID_ACTIONS = ['APPROVED', 'REJECTED'];

// ─────────────────────────────────────────────────────────────────────────────
// Derived status helper — single named function, called wherever EMP-facing
// status is needed. Never inlined so the logic lives in one place only.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the EMP-facing status from the three pipeline status columns.
 *
 * Rules (from spec section 1):
 *  - REJECTED if rm_status = REJECTED OR ape_status = REJECTED
 *  - APPROVED if rm_status = APPROVED AND ape_status = APPROVED
 *    (CFO stage is a downstream audit step — doesn't change what EMP sees)
 *  - PENDING  otherwise
 *
 * @param {object} r - A reimbursements row
 * @returns {'PENDING'|'APPROVED'|'REJECTED'}
 */
function deriveEmpStatus(r) {
  if (r.rm_status === 'REJECTED' || r.ape_status === 'REJECTED') {
    return 'REJECTED';
  }
  if (r.rm_status === 'APPROVED' && r.ape_status === 'APPROVED') {
    return 'APPROVED';
  }
  return 'PENDING';
}

// ─────────────────────────────────────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a reimbursement. EMP-only (enforced at route level).
 *
 * Validations:
 * - title and amount are required.
 * - amount must be a positive number (> 0).
 */
async function createReimbursement({ empId, title, description, amount }) {
  if (!title) {
    throw new ValidationError('title is required');
  }

  const parsedAmount = Number(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new ValidationError('amount must be a positive number greater than zero');
  }

  const reimbursement = await repo.createReimbursement({
    empId,
    title,
    description: description || null,
    amount: parsedAmount,
  });

  return reimbursement;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — approval / rejection by role
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply an RM action (APPROVED or REJECTED) to a reimbursement.
 *
 * Guards:
 * - Reimbursement must exist.
 * - The raising EMP must report directly to this RM (manager_id check).
 * - rm_status must still be PENDING (no double-acting).
 */
async function applyRmAction(reimbursementId, action, requester) {
  if (!VALID_ACTIONS.includes(action)) {
    throw new ValidationError(`action must be APPROVED or REJECTED`);
  }

  const reimbursement = await repo.findById(reimbursementId);
  if (!reimbursement) {
    throw new NotFoundError(`Reimbursement ${reimbursementId} not found`);
  }

  // Scope check: the employee must report to this RM.
  const emp = await repo.findEmpByReimbursementId(reimbursementId);
  if (!emp || emp.manager_id !== requester.id) {
    throw new ForbiddenError(
      'You can only act on reimbursements from your own direct reports'
    );
  }

  // Stage check: RM can only act when rm_status is still PENDING.
  if (reimbursement.rm_status !== 'PENDING') {
    throw new ValidationError(
      `RM has already acted on this reimbursement (current rm_status: ${reimbursement.rm_status})`
    );
  }

  const updated = await repo.updateRmStatus(reimbursementId, action);
  return updated;
}

/**
 * Apply an APE action (APPROVED or REJECTED) to a reimbursement.
 *
 * Guards:
 * - Reimbursement must exist.
 * - rm_status must be APPROVED (RM stage must be complete first).
 * - ape_status must still be PENDING (no double-acting).
 */
async function applyApeAction(reimbursementId, action, requester) {
  if (!VALID_ACTIONS.includes(action)) {
    throw new ValidationError(`action must be APPROVED or REJECTED`);
  }

  const reimbursement = await repo.findById(reimbursementId);
  if (!reimbursement) {
    throw new NotFoundError(`Reimbursement ${reimbursementId} not found`);
  }

  // Stage check: APE cannot act until the RM has approved.
  if (reimbursement.rm_status !== 'APPROVED') {
    throw new ValidationError(
      `Cannot act: RM stage is not yet approved (rm_status: ${reimbursement.rm_status})`
    );
  }

  // Double-acting check.
  if (reimbursement.ape_status !== 'PENDING') {
    throw new ValidationError(
      `APE has already acted on this reimbursement (current ape_status: ${reimbursement.ape_status})`
    );
  }

  const updated = await repo.updateApeStatus(reimbursementId, action, requester.id);
  return updated;
}

/**
 * Apply a CFO action (APPROVED or REJECTED) to a reimbursement.
 *
 * Guards:
 * - Reimbursement must exist.
 * - ape_status must be APPROVED (APE stage must be complete first).
 * - cfo_status must still be PENDING (no double-acting).
 */
async function applyCfoAction(reimbursementId, action) {
  if (!VALID_ACTIONS.includes(action)) {
    throw new ValidationError(`action must be APPROVED or REJECTED`);
  }

  const reimbursement = await repo.findById(reimbursementId);
  if (!reimbursement) {
    throw new NotFoundError(`Reimbursement ${reimbursementId} not found`);
  }

  // Stage check: CFO only acts after APE approval.
  if (reimbursement.ape_status !== 'APPROVED') {
    throw new ValidationError(
      `Cannot act: APE stage is not yet approved (ape_status: ${reimbursement.ape_status})`
    );
  }

  // Double-acting check.
  if (reimbursement.cfo_status !== 'PENDING') {
    throw new ValidationError(
      `CFO has already acted on this reimbursement (current cfo_status: ${reimbursement.cfo_status})`
    );
  }

  const updated = await repo.updateCfoStatus(reimbursementId, action);
  return updated;
}

/**
 * Route dispatcher for PATCH /rest/reimbursements/:id.
 * Delegates to the correct role-specific function based on req.user.role.
 */
async function patchReimbursement(reimbursementId, action, requester) {
  switch (requester.role) {
    case 'RM':
      return applyRmAction(reimbursementId, action, requester);
    case 'APE':
      return applyApeAction(reimbursementId, action, requester);
    case 'CFO':
      return applyCfoAction(reimbursementId, action, requester);
    default:
      throw new ForbiddenError('Only RM, APE, and CFO can act on reimbursements');
  }
}

module.exports = { createReimbursement, patchReimbursement, deriveEmpStatus };
