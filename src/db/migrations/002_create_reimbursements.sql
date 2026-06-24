-- Migration 002: create reimbursements table
CREATE TABLE IF NOT EXISTS reimbursements (
  id          SERIAL PRIMARY KEY,
  emp_id      INTEGER NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  description TEXT,
  amount      NUMERIC NOT NULL,
  rm_status   TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (rm_status  IN ('PENDING', 'APPROVED', 'REJECTED')),
  ape_status  TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (ape_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  ape_id      INTEGER REFERENCES users(id),
  cfo_status  TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (cfo_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
