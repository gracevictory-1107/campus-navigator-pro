import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth as authApi, getToken } from "@/lib/api";
import type { ApiUser, Role } from "@/lib/api";

interface AuthContextValue {
  profile: ApiUser | null;
  role: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<ApiUser>;
  signUp: (input: { full_name: string; email: string; password: string; role?: Role }) => Promise<ApiUser>;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    if (!getToken()) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const user = await authApi.me();
      setProfile(user);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      role: profile?.role ?? null,
      loading,
      signIn: async (email, password) => {
        const user = await authApi.login(email, password);
        setProfile(user);
        return user;
      },
      signUp: async (input) => {
        const user = await authApi.register(input);
        setProfile(user);
        return user;
      },
      signOut: () => {
        authApi.logout();
        setProfile(null);
      },
      refresh: loadSession,
    }),
    [profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider.");
  return ctx;
}

/** Convenience booleans for gating UI by role. */
export function useRole() {
  const { role } = useAuth();
  return {
    role,
    isStudent: role === "student",
    isFaculty: role === "faculty",
    isStaffMember: role === "staff",
    isManagement: role === "management",
    isSecurity: role === "security",
    isAdmin: role === "admin",
    /** Security console access (visitor DB, alerts, CCTV, detections). */
    isStaff: role === "security" || role === "admin",
    canViewSecurity: role === "security" || role === "admin" || role === "management",
  };
}
