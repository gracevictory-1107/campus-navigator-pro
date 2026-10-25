# AWDC Campus Navigator

AWDC Campus Navigator is a campus mapping and indoor wayfinding web application for Aditya Women's Degree College, Kakinada. It brings floor maps, room search, route planning, account approval, and role-based campus security tools into one interface.

## Features

- Campus overview and floor-specific maps with room search
- Indoor route planning across the mapped rooms and corridors
- Email/password registration, email verification, and eligible Google sign-in
- Admin-managed pending account approvals and role assignment
- Role-based security dashboard, visitor records, access rules, alerts, and event history
- Browser-based visitor face-template capture and matching
- Responsive layouts, saved places, and light/dark themes

## Technology

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase, Vitest, and Capacitor.

## Local development

Requirements: a supported Node.js version and npm.

```sh
npm install
npm run dev
```

Vite runs on port 8080 by default.

## Validation

Run these checks before submitting code changes:

```sh
npm run lint
npm run test
npm run typecheck
npm run build
```

## Supabase configuration

Set the following environment variables for local development and the production deployment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Only use a publishable/anon key in browser code. Never place a Supabase service-role key, Google OAuth client secret, camera password, or other privileged credential in a `VITE_*` variable or the repository.

For Google OAuth, account approval, and CCTV setup, follow [INTEGRATION_SETUP.md](./INTEGRATION_SETUP.md). Initial Admin and Security roles must be assigned only after institutional identity has been verified; see [supabase/ADMIN_BOOTSTRAP.md](./supabase/ADMIN_BOOTSTRAP.md).

## Operational notes

- Route geometry and walking-time estimates depend on the mapped floor plans. Review routes on site before relying on them for physical wayfinding.
- The CCTV register stores configuration details, but live camera streams are not connected. Entering a camera IP or stream URL does not confirm that a feed is reachable.
- Visitor face-template capture and matching should be used only with institutional approval, appropriate consent, and an approved identity-check process. A face match alone is not proof of institutional identity.
- Enable Supabase leaked-password protection and review the project's security advisories before production use.
