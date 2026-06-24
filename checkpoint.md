# Checkpoint Log

| Tag | Commit | What works at this point |
|---|---|---|
| checkpoint-01 | _(fill after commit)_ | Phase 1 complete: scaffold, migrations, auth |

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
