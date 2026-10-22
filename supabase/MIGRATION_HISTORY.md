# Supabase migration history reconciliation

## Why this file exists

The connected Supabase project records these nine applied migration versions, but the repository previously contained only two migration files with timestamps that did not match the remote ledger. That caused the Supabase Preview check to report: `Remote migration versions not found in local migrations directory`.

The files in `supabase/migrations/` now use the version IDs recorded by the remote migration ledger.

## Historical SQL fidelity

The database records migration version and name, but the missing SQL bodies could not be recovered byte-for-byte from Git. The reconstructed earlier files are derived from the current `supabase/schema.sql`, the current Git history, and read-only inspection of the deployed policies and tables. Their SQL is intended to describe the existing state and be idempotent; this is a reconciliation, not proof that every statement exactly matches the original statement sent to the database.

Do not run these already-applied historical migrations manually against production, and do not treat the comments above as a replacement for reviewing a new migration. No production schema or data changes are part of this repository reconciliation.

## Current workflow

- `supabase/schema.sql` remains the documented bootstrap schema for a separately provisioned database.
- Keep every applied migration version represented by a matching `<version>_<name>.sql` file under `supabase/migrations/`.
- For new changes, create a new migration file, review its SQL and permission impact, commit it before applying, then use the team's approved Supabase CLI/CI workflow.
- Before reconciling future discrepancies, compare `supabase migration list` (or the Supabase migration-list tooling) with the repository. Do not repair the live migration ledger or apply SQL just to make a CI check pass.
- Never change a migration already applied to production to change its meaning. Add a new migration for forward fixes.


## Duplicate version entry for the grants hardening migration

The live Supabase migration ledger currently records the migration name `harden_public_grants_and_align_visitor_schema` under both versions `20261022060000` and `20261022064142`. The repository includes a matching file for each exact ledger version so CI/history checks agree with production. Both SQL files contain the same idempotent forward-hardening statements; do not manually rerun them against production. This duplicate ledger entry is historical bookkeeping, not a request to apply the security changes twice.
