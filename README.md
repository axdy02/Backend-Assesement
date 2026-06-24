# Reimbursements RBAC Backend

A backend for an internal reimbursements tool with role-based access control. Employees raise expense claims that travel through an approval pipeline: RM → APE → CFO visibility.

## Quick Start

```bash
# 1. Clone and install
npm install

# 2. Create a .env file (see .env.example)
cp .env.example .env
# Edit DATABASE_URL and SESSION_SECRET

# 3. Set up the database
npm run db:migrate      # Creates tables (idempotent — safe to run twice)
npm run db:seed-data    # Seeds the CFO account (idempotent)

# 4. Start the server
npm run dev             # Runs on http://localhost:7002
```

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Language | Plain JavaScript (no TypeScript) | Spec requirement |
| Framework | Express.js | Spec requirement |
| Database | PostgreSQL | Spec requirement |
| Auth | Signed cookie via `cookie-parser` | Cookie-based, no JWT library needed |
| Password hashing | bcrypt (10 rounds) | Industry standard |

## API Endpoints

All paths are prefixed with `/rest`.

### Auth — `/rest/onboardings`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | none | Create EMP account (`@org.com` email only) |
| POST | `/login` | none | Validate credentials, set signed cookie |
| POST | `/logout` | none | Clear cookie |

### Roles — `/rest/roles`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/assign` | CFO | Assign role to a user |

### Employees — `/rest/employees`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | RM/APE/CFO | Role-scoped employee list |
| POST | `/assign` | CFO | Link EMP to RM (set manager_id) |
| DELETE | `/assign` | CFO | Unlink EMP from RM (clear manager_id) |

### Reimbursements — `/rest/reimbursements`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | EMP | Raise a new claim |
| GET | `/` | all | Role-scoped claim list |
| GET | `/:userId` | RM | View a subordinate's claim history |
| PATCH | `/:id` | RM/APE/CFO | Approve or reject at your stage |

## Data Model Decisions

### Schema overview

```
users(id, name, email, password_hash, role, manager_id → users.id, created_at)
reimbursements(id, emp_id → users.id, title, description, amount,
               rm_status, ape_status, ape_id → users.id, cfo_status,
               created_at, updated_at)
```

### Why `manager_id` on the user, not a join table

Every employee reports to *exactly one* RM (1:1 per employee). A nullable self-referencing FK on `users` is the simplest correct model and maps directly onto the assign/unassign endpoints. A join table would be appropriate for many-to-many (e.g., if one RM could have multiple managers) — that's not the spec.

### Why three status columns

The spec describes a *pipeline*, not a flag. A single `status` column can't represent "approved at stage 1, pending at stage 2" simultaneously, and the four different `GET /rest/reimbursements` visibility queries each require that distinction (e.g., RM sees `rm_status = 'PENDING'`, APE sees `rm_status = 'APPROVED' AND ape_status = 'PENDING'`).

### Derived EMP-facing status

The status an employee sees is *derived* at read time from the three raw columns — it is never stored. The logic lives in a single named function `deriveEmpStatus(r)` in `reimbursements.service.js`:

- `REJECTED` if `rm_status = REJECTED` **or** `ape_status = REJECTED`
- `APPROVED` if `rm_status = APPROVED` **and** `ape_status = APPROVED`
- `PENDING` otherwise

The CFO stage is a downstream audit step. Whether the CFO has acted does not change what the EMP sees (per the spec's "RM **and** one of the APEs" rule).

## Assumptions and Design Decisions

### Assigning the CFO role via `POST /rest/roles/assign`

This is **allowed**. The spec says only that the seeded account is the initial CFO; it does not prohibit the CFO from promoting another user to CFO. The seeded CFO account is the root; if more CFOs are needed, the existing CFO can create them. If you wish to restrict this to one CFO, add a check in `roles.service.js`.

### Re-assigning an EMP who already has a manager

`POST /rest/employees/assign` **overwrites** the existing manager relationship silently. The new `manager_id` replaces the old one. This is the least-surprising behaviour for an admin (CFO) managing org chart changes. The alternative (returning an error) would require a DELETE-then-POST flow for a routine re-org.

### Role changes mid-flight

If a user's role is changed after they have approved a reimbursement (e.g., an RM is demoted to EMP), their prior approvals are **preserved unchanged**. The `rm_status = 'APPROVED'` row stays approved. This is the correct behaviour because historical records should not be retroactively altered. The audit trail (who approved what) is intact via `ape_id`. No compensating logic is needed.

### `GET /rest/reimbursements/:userId` — who can call it

Only an RM can call this endpoint, and only for their own direct reports. The "subordinate" check uses `manager_id` — if `target.manager_id ≠ requester.id`, the request is rejected with 403. CFOs are not granted access to this endpoint; they see `ape_status = 'APPROVED'` claims via `GET /rest/reimbursements` instead.

### Empty list responses

All list endpoints return `{ "reimbursements": [] }` or `{ "users": [] }` — never `null` and never a 404 — when no items match the query. This matches the spec's requirement.

### Cookie security

- `httpOnly: true` — not accessible to JavaScript in the browser
- `signed: true` — HMAC-signed with `SESSION_SECRET`; tampering returns a 401
- `sameSite: 'lax'` — prevents CSRF from cross-site requests
- `maxAge: 8h` — reasonable working-day session

## Project Structure

```
src/
  config/db.js              pg connection pool
  db/
    migrations/             001_create_users.sql, 002_create_reimbursements.sql
    migrate.js              runs migrations in order
    seed.js                 inserts CFO account idempotently
  middleware/
    authenticate.js         reads signed cookie → req.user
    authorize.js            role-list factory → 403 if not allowed
  modules/
    auth/                   register, login, logout
    roles/                  POST /roles/assign (CFO-only)
    employees/              GET/POST/DELETE /employees
    reimbursements/         POST/GET/PATCH /reimbursements
  utils/
    errors.js               AppError hierarchy (ValidationError, etc.)
    asyncHandler.js         wraps async handlers for Express
  app.js                    Express app wiring
  server.js                 listens on port 7002
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SESSION_SECRET` | yes | Long random string for signing cookies |
| `PORT` | no | Defaults to 7002 |
