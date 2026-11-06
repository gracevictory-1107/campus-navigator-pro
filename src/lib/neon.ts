import { createClient, SupabaseAuthAdapter } from "@neondatabase/neon-js";

/**
 * Neon client for the staged Supabase-to-Neon migration.
 * Keeps the existing Supabase-compatible authentication method shapes
 * while database queries move to the Neon Data API.
 */
const authUrl = import.meta.env.VITE_NEON_AUTH_URL?.trim();
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL?.trim();

export const neonConfigured = Boolean(authUrl && dataApiUrl);

export const neon = neonConfigured
  ? createClient({
      auth: {
        url: authUrl!,
        adapter: SupabaseAuthAdapter(),
      },
      dataApi: {
        url: dataApiUrl!,
      },
    })
  : null;
