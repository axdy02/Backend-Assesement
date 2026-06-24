'use strict';

const pool = require('../../config/db');

/**
 * Find a user by email. Returns the full row (including password_hash)
 * so the service layer can verify the password.
 */
async function findByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Find a user by id. Returns the row without password_hash.
 */
async function findById(id) {
  const result = await pool.query(
    'SELECT id, name, email, role, manager_id, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Insert a new user and return the created row (without password_hash).
 */
async function createUser({ name, email, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, role, manager_id, created_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
}

module.exports = { findByEmail, findById, createUser };
