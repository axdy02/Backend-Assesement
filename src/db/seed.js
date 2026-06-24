'use strict';

/**
 * db:seed-data — inserts the CFO account idempotently.
 * Running this script twice must not crash or create a duplicate.
 *
 * CFO credentials:
 *   email:    cfo@org.com
 *   password: CFO#ORG@April2026
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CFO_EMAIL    = 'cfo@org.com';
const CFO_PASSWORD = 'CFO#ORG@April2026';
const CFO_NAME     = 'CFO';
const SALT_ROUNDS  = 10;

async function seed() {
  const passwordHash = await bcrypt.hash(CFO_PASSWORD, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'CFO')
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [CFO_NAME, CFO_EMAIL, passwordHash]
  );

  if (result.rowCount > 0) {
    console.log(`✓ CFO account created (id=${result.rows[0].id})`);
  } else {
    console.log('CFO account already exists — nothing inserted.');
  }

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
