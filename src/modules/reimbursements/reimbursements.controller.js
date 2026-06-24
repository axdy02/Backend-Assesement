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

module.exports = { createReimbursement, patchReimbursement };
