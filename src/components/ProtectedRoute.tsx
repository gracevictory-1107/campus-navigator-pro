import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/lib/api";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Roles permitted to view. Omit to allow any signed-in user. */
  allow?: Role[];
}

export default function ProtectedRoute({ children, allow }: Props) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (allow && !allow.includes(profile.role)) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Access restricted</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your role ({profile.role}) isn't authorized for this area.
          </p>
        </div>
        <Button onClick={() => (window.location.href = "/")}>Back to Navigator</Button>
      </div>
    );
  }

  return <>{children}</>;
}
