import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, CircleAlert, Clock3, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthenticatedRole, supabase } from "@/lib/supabase";
import type { Role } from "@/security/types";

type CallbackState = "loading" | "pending" | "ready" | "error";

const roleLabels: Record<Role, string> = {
  pending: "Pending approval",
  student: "Student",
  faculty: "Faculty",
  staff: "Staff",
  management: "Management",
  security: "Security",
  admin: "Admin",
};

export default function AuthCallback() {
  const [state, setState] = useState<CallbackState>("loading");
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    let active = true;

    const completeConfirmation = async () => {
      try {
        if (!supabase) throw new Error("Authentication is not configured for this website.");

        // Supabase JS detects the confirmation token in the URL and establishes the session.
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          throw new Error("This confirmation link may have expired or already been used. Open the newest verification email and try again.");
        }

        const assignedRole = await getAuthenticatedRole();
        if (!assignedRole) {
          throw new Error("Your email was confirmed, but your campus profile could not be found. Please contact the campus administrator.");
        }

        if (active) {
          setRole(assignedRole);
          setState(assignedRole === "pending" ? "pending" : "ready");
        }
      } catch {
        if (active) setState("error");
      }
    };

    void completeConfirmation();
    return () => { active = false; };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {state === "loading" && (
          <div className="grid justify-items-center gap-3 text-center">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">Confirming your email…</h1>
            <p className="text-sm text-muted-foreground">Please keep this page open for a moment.</p>
          </div>
        )}

        {state === "pending" && (
          <div className="grid justify-items-center gap-3 text-center">
            <Clock3 className="h-10 w-10 text-amber-600" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">Email verified successfully</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Your account has been saved. Campus access is now waiting for an Admin to assign the correct role. You do not need Student access to use this app.
            </p>
            <p className="text-xs text-muted-foreground">Current status: {roleLabels[role ?? "pending"]}</p>
            <Button asChild className="mt-2 w-full"><Link to="/campus">Continue to Campus Navigator</Link></Button>
          </div>
        )}

        {state === "ready" && (
          <div className="grid justify-items-center gap-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">Email verified successfully</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Your campus account is verified and its assigned role is {roleLabels[role ?? "pending"]}.
            </p>
            <Button asChild className="mt-2 w-full"><Link to="/campus">Continue to Campus Navigator</Link></Button>
            {(role === "admin" || role === "management" || role === "security") && (
              <Button variant="outline" asChild className="w-full"><Link to="/security">Open Campus Security</Link></Button>
            )}
          </div>
        )}

        {state === "error" && (
          <div className="grid justify-items-center gap-3 text-center">
            <CircleAlert className="h-10 w-10 text-destructive" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">We couldn’t finish verification</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              The link may be expired, already used, or redirected incorrectly. Return to the website and use the latest verification email. If it still fails, the Supabase Auth URL configuration needs to be checked.
            </p>
            <Button asChild className="mt-2 w-full"><Link to="/">Return to Campus Navigator</Link></Button>
            <Button variant="outline" asChild className="w-full"><Link to="/security">Return to Sign In</Link></Button>
          </div>
        )}
      </section>
    </main>
  );
}
