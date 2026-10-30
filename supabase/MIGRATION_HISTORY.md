# Supabase migration history reconciliation

## Why this file exists
The connected Supabase project records 19 applied migration versions. The repository now contains a matching `<version>_<name>.sql` file for each recorded version, including the two campus visitor-access migrations that were previously absent from Git.

## Historical SQL fidelity
The remote migration ledger stores a version and name, but several older SQL bodies could not be recovered byte-for-byte from Git. Reconstructed files are derived from the current `supabase/schema.sql`, Git history, and read-only inspection of the deployed policies, tables and access rules. They describe the intended deployed state and are migration-history reconciliation files, not proof that every historical statement is byte-for-byte identical to the SQL originally applied.

In particular, `20261030044124_configure_campus_visitor_access_matrix.sql` and `20261030044927_sync_faculty_staff_visitor_full_access.sql` were reconstructed to represent the recorded access-matrix rollout and Faculty/Staff full-access update. They are already applied in production. Do not execute these historical files manually against production.

## Current workflow
- `supabase/schema.sql` remains the documented bootstrap schema for a separately provisioned database.
- Keep every applied migration version represented by a matching `<version>_<name>.sql` file under `supabase/migrations/`.
- For new changes, create a new migration file, review its SQL and permission impact, commit it before applying, then use the team's approved Supabase CLI/CI workflow.
- Before reconciling future discrepancies, compare `supabase migration list` (or the Supabase migration-list tooling) with the repository. Do not repair the live migration ledger or apply SQL just to make a CI check pass.
- Never change a migration already applied to production to change its meaning. Add a new migration for forward fixes.
- The migration `20261030054353_separate_staff_role_and_open_space_access.sql` is the forward migration for the separate `staff` profile role and the six visitor access rules for the Main Building Ground Floor Open Space.
- The migration `20261030054818_optimize_security_rls_policies.sql` consolidates overlapping read policies and wraps profile auth lookups in scalar subqueries without changing the effective role access.

## Duplicate version entry for the grants hardening migration
The live Supabase migration ledger records the migration name `harden_public_grants_and_align_visitor_schema` under both versions `20261022060000` and `20261022064142`. The repository includes a matching file for each exact ledger version so CI/history checks agree with production. Both SQL files contain the same idempotent forward-hardening statements; do not manually rerun them against production. This duplicate ledger entry is historical bookkeeping, not a request to apply the security changes twice.
