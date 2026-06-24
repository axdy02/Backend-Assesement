'use strict';

require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const { AppError } = require('./utils/errors');

const authRoutes             = require('./modules/auth/auth.routes');
const rolesRoutes            = require('./modules/roles/roles.routes');
const employeesRoutes        = require('./modules/employees/employees.routes');
const reimbursementsRoutes   = require('./modules/reimbursements/reimbursements.routes');

const app = express();

// ── Request parsing ────────────────────────────────────────────────────
app.use(express.json());

// cookie-parser with secret so we can use signed cookies
app.use(cookieParser(process.env.SESSION_SECRET));

// ── Routes ─────────────────────────────────────────────────────────────
app.use('/rest/onboardings',     authRoutes);
app.use('/rest/roles',           rolesRoutes);
app.use('/rest/employees',       employeesRoutes);
app.use('/rest/reimbursements',  reimbursementsRoutes);

// ── 404 handler (no route matched) ────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ───────────────────────────────────────────────
// Must have four arguments for Express to recognise it as an error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Known operational error — use its status code and message
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Unknown / programmer error — log it, return a generic 500
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
