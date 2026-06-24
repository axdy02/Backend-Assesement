'use strict';

const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');
const controller   = require('./employees.controller');

const router = Router();

// All three routes require authentication.
// GET blocks EMP via authorize middleware (403 before reaching the service).
// POST and DELETE /assign are CFO-only.

router.get(
  '/',
  authenticate,
  authorize(['RM', 'APE', 'CFO']),
  controller.listEmployees
);

router.post(
  '/assign',
  authenticate,
  authorize(['CFO']),
  controller.assignEmployee
);

router.delete(
  '/assign',
  authenticate,
  authorize(['CFO']),
  controller.removeEmployee
);

module.exports = router;
