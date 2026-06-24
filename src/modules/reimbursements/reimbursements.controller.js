'use strict';

const reimbursementsService = require('./reimbursements.service');
const asyncHandler          = require('../../utils/asyncHandler');

/**
 * POST /rest/reimbursements
 * Body: { title, description, amount }
 * EMP-only. Creates a new reimbursement claim.
 */
const createReimbursement = asyncHandler(async (req, res) => {
  const { title, description, amount } = req.body;

  const reimbursement = await reimbursementsService.createReimbursement({
    empId: req.user.id,
    title,
    description,
    amount,
  });

  res.status(201).json({ message: 'Reimbursement created successfully', reimbursement });
});

/**
 * PATCH /rest/reimbursements/:id
 * Body: { action }  — "APPROVED" or "REJECTED"
 * RM / APE / CFO only. Each role can only act at their own stage.
 */
const patchReimbursement = asyncHandler(async (req, res) => {
  const id     = Number(req.params.id);
  const { action } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'action is required (APPROVED or REJECTED)' });
  }

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid reimbursement id' });
  }

  const reimbursement = await reimbursementsService.patchReimbursement(id, action, req.user);
  res.status(200).json({ message: 'Reimbursement updated successfully', reimbursement });
});

/**
 * GET /rest/reimbursements
 * Role-scoped list:
 *   EMP  → own claims (with derived status)
 *   RM   → pending-at-RM claims from own reports
 *   APE  → rm-approved, ape-pending claims
 *   CFO  → ape-approved claims
 * Empty list returns { reimbursements: [] }, never null or 404.
 */
const listReimbursements = asyncHandler(async (req, res) => {
  const reimbursements = await reimbursementsService.listReimbursements(req.user);
  res.status(200).json({ reimbursements });
});

/**
 * GET /rest/reimbursements/:userId
 * Returns a specific EMP's reimbursement history.
 * Only accessible if the target EMP reports directly to the requester (RM).
 */
const listByUser = asyncHandler(async (req, res) => {
  const targetUserId = Number(req.params.userId);

  if (isNaN(targetUserId) || targetUserId <= 0) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  const reimbursements = await reimbursementsService.listByUser(targetUserId, req.user);
  res.status(200).json({ reimbursements });
});

module.exports = { createReimbursement, patchReimbursement, listReimbursements, listByUser };

