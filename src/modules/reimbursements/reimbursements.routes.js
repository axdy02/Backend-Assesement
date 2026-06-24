'use strict';

const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');
const controller   = require('./reimbursements.controller');

const router = Router();

// GET /rest/reimbursements — role-scoped list (all authenticated roles)
router.get(
  '/',
  authenticate,
  authorize(['EMP', 'RM', 'APE', 'CFO']),
  controller.listReimbursements
);

// POST /rest/reimbursements — EMP raises a claim
router.post(
  '/',
  authenticate,
  authorize(['EMP']),
  controller.createReimbursement
);

// GET /rest/reimbursements/:userId — RM views a subordinate's full claim history
// Must come before PATCH /:id so Express doesn't confuse the param name.
// Both are parametric but differ by HTTP method, so no ambiguity at runtime.
router.get(
  '/:userId',
  authenticate,
  authorize(['RM']),
  controller.listByUser
);

// PATCH /rest/reimbursements/:id — RM/APE/CFO act on a claim
router.patch(
  '/:id',
  authenticate,
  authorize(['RM', 'APE', 'CFO']),
  controller.patchReimbursement
);

module.exports = router;

