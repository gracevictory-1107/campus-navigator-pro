# Secure initial Admin provisioning

The bootstrap schema deliberately does not insert placeholder Admin, Security, Faculty, or Student profiles under public/free-mail addresses.

## Required process

1. Create the person's account in Supabase Auth using an email address verified by the college administration (prefer the college's institutional domain).
2. Confirm the Auth user's email is verified and the person is authorized for the intended campus role.
3. From the Supabase Dashboard SQL Editor, use the verified user's exact email to promote the trigger-created profile. Do not link a profile by email alone and do not reuse a placeholder mailbox.

Example for the first Admin, after replacing the placeholder with a verified, college-approved address:

```sql
UPDATE public.profiles AS p
SET role = 'admin'
FROM auth.users AS u
WHERE p.auth_user_id = u.id
  AND lower(p.email) = lower(u.email)
  AND lower(u.email) = lower('REPLACE_WITH_VERIFIED_COLLEGE_EMAIL')
  AND u.email_confirmed_at IS NOT NULL
RETURNING p.id, p.role;
```

The query must return exactly one row. If it returns zero or more than one row, stop and investigate rather than improvising a role assignment. Keep the output private because it identifies an authorized account.

Repeat the same verified-account process for Security, Management, and other staff roles. Never grant Admin or Security merely because an applicant can sign up or control an unverified placeholder email.

## Existing production profiles

The current production database already contains the original seeded profile IDs linked to confirmed Auth accounts. This repository change does **not** demote, delete, or relink those accounts, because that could lock authorized staff out. The college owner must confirm the identity and authorization of each linked Admin/Security account before any role change.
