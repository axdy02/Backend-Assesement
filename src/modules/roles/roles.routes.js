'use strict';

const { Router } = require('express');
const authenticate  = require('../../middleware/authenticate');
const authorize     = require('../../middleware/authorize');
const controller    = require('./roles.controller');

const router = Router();

// CFO-only
router.post('/assign', authenticate, authorize(['CFO']), controller.assignRole);

module.exports = router;
