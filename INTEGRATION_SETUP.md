# Google Sign-in and CCTV Integration Setup

This project now includes a Google sign-in button and a 109-entry CCTV configuration register. Provider credentials and live camera streams are intentionally not stored in the repository.

## Enable Google sign-in

1. In Google Cloud Console, create/select a project and create an OAuth Client ID for a **Web application**.
2. Add this as an **Authorized JavaScript origin**:
   - `https://campus-navigator-pro.vercel.app`
   - For local development only, add `http://localhost:5173`.
3. In the Google OAuth client, add the Supabase Auth callback as the **Authorized redirect URI**:
   - `https://spcmsiyoeaiejyvnjkqe.supabase.co/auth/v1/callback`
   Use the callback URI shown in your Supabase Dashboard if the project URL changes.
4. In Supabase Dashboard, open **Authentication → Sign In / Providers → Google**, enable Google, then enter the OAuth Client ID and Client Secret from Google.
5. In Supabase Dashboard, open **Authentication → URL Configuration**:
   - Set **Site URL** to `https://campus-navigator-pro.vercel.app`.
   - Add `https://campus-navigator-pro.vercel.app/auth/callback` to the redirect URL allow list.
   - For local development only, add `http://localhost:5173/auth/callback`.
6. Save settings and test from the stable production URL. New Google accounts are created with the default **Pending** campus role until an Admin approves the role.

Never commit or paste the Google Client Secret into source code, GitHub, or a public chat.

## Connect the 109 CCTV cameras

- The current database has 109 configuration slots, named `CAM-01` through `CAM-109`. They are tracking IDs, not verified NVR labels; cross-check them against the college CCTV/NVR inventory.
- For each camera, record the actual ID/label, building, floor, mapped location (or mark it as camera-free), IP address, and supported stream/provider details.
- The Security page currently stores IP and stream/NVR URL configuration. Saving a URL does not make a stream live; the current feed panels remain simulation-only until a real integration is implemented and verified.
- Before coding the live video connection, confirm the NVR/DVR/VMS manufacturer/model, API or supported integration method, stream format (for example HLS or WebRTC), authentication method, and who is allowed to view each camera.
- Do not expose camera usernames/passwords, private IPs, or authenticated stream URLs to public users. RTSP streams cannot be played directly by most browsers; use a secured server-side gateway or an approved vendor/NVR API and a browser-supported stream transport.

The annotated campus layouts should be used to map each camera and mark areas without cameras. Do not guess unknown locations from screenshots or file names.
