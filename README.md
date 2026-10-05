# AWDC Campus Navigator

AWDC Campus Navigator is a React + TypeScript indoor campus navigation and security dashboard for Aditya Women's Degree College, Kakinada.

## Core features

- Interactive multi-floor campus maps and room search
- Indoor route planning with role-based access checks
- Visitor registration with AI face biometric verification
- Security dashboard with visitors, events, alerts and access control
- CCTV configuration for college-provided camera IP and NVR/stream details
- Supabase persistence with row-level security
- Responsive interface with light and dark themes

## Development

```sh
npm install
npm run dev
```

The local Vite development server runs on port 8080.

## Validation

```sh
npm run build
npm run test
npm run lint
```

## Production notes

The deployed application is independent of the local Vite server, so it remains available after closing VS Code.

CCTV feeds remain in simulation mode until the college provides reachable camera/NVR connection details. An IP address alone does not create a browser stream.

Supabase must be configured with the required Vite environment variables, and `supabase/schema.sql` must be applied to the project database.

## Technology

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase, Vitest
