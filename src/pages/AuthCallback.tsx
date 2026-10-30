import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, CircleAlert, Clock3, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthenticatedRole, hasVerifiedEmailPasswordIdentity, supabase } from "@/lib/supabase";
import type { Role } from "@/security/types";
import { getRoleLandingPath } from "@/lib/roleLanding";

type CallbackState = "loading" | "pending" | "ready" | "unregistered" | "registerFirst" | "googleOnlyExisting" | "error";

const roleLabels: Record<Role, string> = {
  pending: "Pending approval",
  student: "Student",
  faculty: "Faculty (Teaching and Technical/Lab)",
  staff: "Staff (Office, Support and Maintenance)",
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
      // Supabase's Before User Created hook rejects first-time Google signups.
      // Detect that rejection before checking for a session so stale sessions
      // cannot hide the registration-required message.
      const queryParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const authErrorCode = queryParams.get("error_code")
        ?? hashParams.get("error_code")
        ?? queryParams.get("error")
        ?? hashParams.get("error");
      const authErrorDescription = (
        queryParams.get("error_description")
        ?? hashParams.get("error_description")
        ?? ""
      ).toLowerCase();

      if (
        authErrorCode === "hook_rejected"
        || authErrorDescription.includes("register with your email and password and verify your email address")
      ) {
        if (active) setState("registerFirst");
        return;
      }

      try {
        if (!supabase) throw new Error("Authentication is not configured for this website.");

        // Supabase JS detects confirmation tokens in the URL and establishes the session.
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          throw new Error("There is no active session after the sign-in callback.");
        }

        // Do not admit a Google-only account, even if an old test left a campus
        // profile behind. Require a verified email/password identity as well.
        if (!hasVerifiedEmailPasswordIdentity(data.session.user)) {
          if (active) setState("googleOnlyExisting");
          await supabase.auth.signOut();
          return;
        }

        const assignedRole = await getAuthenticatedRole();
        if (!assignedRole) {
          if (active) setState("unregistered");
          return;
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
            <h1 className="text-xl font-semibold text-foreground">Checking your sign-in…</h1>
            <p className="text-sm text-muted-foreground">Please keep this page open for a moment.</p>
          </div>
        )}

        {state === "registerFirst" && (
          <div className="grid justify-items-center gap-3 text-center">
            <CircleAlert className="h-10 w-10 text-amber-600" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">Register and verify your email first</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              This Google account is not registered for Campus Navigator yet. Choose Create account, register with this same email address and a password, and verify the confirmation email. After verification, return and use Continue with Google.
            </p>
            <Button asChild className="mt-2 w-full"><Link to="/?mode=signUp">Create account</Link></Button>
            <Button variant="outline" asChild className="w-full"><Link to="/">Back to Sign In</Link></Button>
          </div>
        )}

        {state === "googleOnlyExisting" && (
          <div className="grid justify-items-center gap-3 text-center">
            <CircleAlert className="h-10 w-10 text-amber-600" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">Email registration required</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              This Google account was used before without completing email/password registration. Campus access is blocked. Because an authentication record already exists for this address, contact the campus administrator to reset that earlier Google-only test account; then register with email and password and verify your email before using Google sign-in.
            </p>
            <Button asChild className="mt-2 w-full"><Link to="/">Return to Campus Navigator</Link></Button>
          </div>
        )}

        {state === "pending" && (
          <div className="grid justify-items-center gap-3 text-center">
            <Clock3 className="h-10 w-10 text-amber-600" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">Email verified, approval pending</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Your email is verified, but campus access is not active yet. Please wait for a campus Admin to approve your account and assign the correct role.
            </p>
            <p className="text-xs text-muted-foreground">Current status: {roleLabels[role ?? "pending"]}</p>
            <Button asChild className="mt-2 w-full"><Link to="/">Back to Campus Navigator</Link></Button>
          </div>
        )}

        {state === "ready" && (
          <div className="grid justify-items-center gap-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">Sign-in successful</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Your email is verified and your campus account has the {roleLabels[role ?? "pending"]} role.
            </p>
            <Button asChild className="mt-2 w-full">
              <Link to={getRoleLandingPath(role ?? "pending")}>
                {role === "security" ? "Open Security Dashboard" : "Continue to Campus Navigator"}
              </Link>
            </Button>
            {(role === "admin" || role === "management") && (
              <Button variant="outline" asChild className="w-full"><Link to="/security">Open Campus Security</Link></Button>
            )}
          </div>
        )}

        {state === "unregistered" && (
          <div className="grid justify-items-center gap-3 text-center">
            <CircleAlert className="h-10 w-10 text-amber-600" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">Campus account not registered</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              There is no campus profile linked to this account yet. Choose Create account, register with your email and password, then verify your email before using Google sign-in.
            </p>
            <Button asChild className="mt-2 w-full"><Link to="/?mode=signUp">Create account</Link></Button>
          </div>
        )}

        {state === "error" && (
          <div className="grid justify-items-center gap-3 text-center">
            <CircleAlert className="h-10 w-10 text-destructive" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">We couldn’t finish sign-in</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Your sign-in session could not be confirmed. If you registered with email and password, open the latest verification email and click its link. Otherwise, return to the website and try signing in again. If the issue continues, contact the campus administrator.
            </p>
            <Button asChild className="mt-2 w-full"><Link to="/">Return to Campus Navigator</Link></Button>
            <Button variant="outline" asChild className="w-full"><Link to="/security">Return to Sign In</Link></Button>
          </div>
        )}
      </section>
    </main>
  );
}
