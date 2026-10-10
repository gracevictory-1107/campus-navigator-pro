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

## Google sign-in setup

The public welcome page already includes the **Continue with Google** OAuth flow. It will work after the Google provider is configured:

1. In Google Cloud Console, create an OAuth Client ID with application type **Web application**.
2. Add this exact URI under the Google OAuth client's **Authorized redirect URIs**: `https://spcmsiyoeaiejyvnjkqe.supabase.co/auth/v1/callback`.
3. In Supabase Dashboard, open **Authentication → Sign In / Providers → Google**, enable Google, and enter the Google Client ID and Client Secret.
4. In Supabase **Authentication → URL Configuration**, set the Site URL to `https://campus-navigator-pro.vercel.app` and allow `https://campus-navigator-pro.vercel.app/auth/callback`. Add your localhost callback only for local development.
5. Save and test Google sign-in with a test account. New campus profiles default to **Pending** until an Admin assigns the appropriate role.

Never put the Google Client Secret in this repository or in a `VITE_*` environment variable. The secret belongs only in the Supabase provider settings.

## CCTV integration checklist

The database now has 109 placeholder configuration records (`CAM-01` through `CAM-109`) with blank IP/stream fields, plus a restricted `camera_coverage_areas` table for mapped camera areas and camera-free zones. These IDs are provisional; confirm them against the actual NVR labels before connecting feeds.

When the college provides camera details, verify the NVR/vendor, network reachability, supported browser transport (for example HLS/WebRTC/MJPEG where appropriate), stream authentication, and whether a secure server-side relay is required. RTSP URLs and private camera credentials must not be exposed directly in public browser code. A stored URL is not proof that a camera feed is live.

## Technology

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase, Vitest
