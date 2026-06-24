'use strict';

const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');
const controller   = require('./reimbursements.controller');

const router = Router();

// POST — EMP only creates a claim
router.post(
  '/',
  authenticate,
  authorize(['EMP']),
  controller.createReimbursement
);

// PATCH — RM / APE / CFO act on a claim at their own stage
router.patch(
  '/:id',
  authenticate,
  authorize(['RM', 'APE', 'CFO']),
  controller.patchReimbursement
);

module.exports = router;
