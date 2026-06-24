# Checkpoint Log

| Tag | Commit | What works at this point |
|---|---|---|
| checkpoint-01 | 3924cbe | Phase 1 complete: scaffold, migrations, auth |
| checkpoint-02 | 413f531 | Phase 2 complete: roles + employees RBAC |
| checkpoint-03 | 57903d1 | Phase 3 complete: reimbursement write side |
| checkpoint-04 | 35f4a57 | Phase 4a complete: reimbursement read side |

---

## How to create a checkpoint

```bash
git tag checkpoint-0N && git push --tags
```

## How to roll back to a checkpoint

```bash
git reset --hard checkpoint-0N
```

## Policy

Before any risky change (refactor, library swap, major query restructure):
1. Verify `npm run dev`, `npm run db:migrate`, and `npm run db:seed-data` all pass.
2. Tag: `git tag checkpoint-0N && git push --tags`.
3. Then make your change.
