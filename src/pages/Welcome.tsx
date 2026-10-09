import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, MapPinned, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PublicPageLayout from "@/components/PublicPageLayout";
import { signInWithSupabase, signUpWithSupabase, supabaseConfigured } from "@/lib/supabase";
import { useSecurity } from "@/security/SecurityContext";
import { toast } from "sonner";

type AuthMode = "signIn" | "signUp";

const highlights = [
  { title: "Find campus rooms", text: "Explore mapped buildings and floors." },
  { title: "Plan a route", text: "Choose a starting point and destination." },
  { title: "Get campus help", text: "Open Help Desk or ask the Campus Guide Assistant." },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { signedIn, role } = useSecurity();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setConfirmationSent(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setConfirmationSent(false);
    try {
      if (!supabaseConfigured) {
        throw new Error("Sign-in is not configured right now. Please contact the campus administrator.");
      }
      if (mode === "signIn") {
        await signInWithSupabase(email, password);
        toast.success("Signed in. Welcome to AWDC Campus Navigator.");
        navigate("/campus", { replace: true });
      } else {
        const result = await signUpWithSupabase(fullName, email, password);
        if (result.needsEmailConfirmation) {
          setConfirmationSent(true);
          setPassword("");
          toast.success("Account created. Check your email to verify it.");
        } else {
          toast.success("Account created. Welcome to AWDC Campus Navigator.");
          navigate("/campus", { replace: true });
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not complete this request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicPageLayout activePage="home">
      <main className="mx-auto grid min-h-[calc(100vh-145px)] max-w-7xl items-center gap-10 px-4 py-9 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-14">
        <section className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
            <MapPinned className="h-4 w-4" /> Campus wayfinding, made simpler
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your campus. <span className="text-primary">One clear route.</span>
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Sign in to explore the AWDC campus map, search rooms, and plan routes between mapped locations.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <span className="mb-3 grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                <h2 className="text-sm font-semibold">{item.title}</h2>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>

          {signedIn && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div>
                <p className="text-sm font-semibold">You’re already signed in</p>
                <p className="mt-1 text-xs text-muted-foreground">Account role: {role === "pending" ? "Pending approval" : role.charAt(0).toUpperCase() + role.slice(1)}. Continue to the map when you’re ready.</p>
              </div>
              <Link to="/campus" className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Open Campus Map <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Link to="/about" className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2.5 text-sm font-medium hover:bg-accent">
              About the project <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/help-desk" className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2.5 text-sm font-medium hover:bg-accent">
              Help Desk
            </Link>
            <Link to="/ai-assistant" className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2.5 text-sm font-medium hover:bg-accent">
              Campus AI Assistant
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-primary/5">
            <div className="border-b border-border p-6 sm:p-7">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                {mode === "signIn" ? <LockKeyhole className="h-6 w-6" /> : <Users className="h-6 w-6" />}
              </div>
              <h2 className="font-display text-2xl font-bold">{mode === "signIn" ? "Welcome back" : "Create your account"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signIn" ? "Sign in to open the campus navigator." : "Use your details to request campus account access."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1 bg-muted/60 p-1.5 mx-6 mt-5 rounded-xl">
              <button type="button" onClick={() => switchMode("signIn")} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${mode === "signIn" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} aria-pressed={mode === "signIn"}>
                Sign in
              </button>
              <button type="button" onClick={() => switchMode("signUp")} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${mode === "signUp" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} aria-pressed={mode === "signUp"}>
                Create account
              </button>
            </div>

            <form onSubmit={submit} className="grid gap-4 p-6 sm:p-7">
              {confirmationSent && (
                <div role="status" className="flex gap-2 rounded-xl border border-emerald-600/25 bg-emerald-500/5 p-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Verification email sent. Open the latest email link, verify your address, then return here to sign in.</span>
                </div>
              )}
              {mode === "signUp" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="welcome-name">Full name</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="welcome-name" className="pl-9" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required minLength={2} />
                  </div>
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="welcome-email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="welcome-email" className="pl-9" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="welcome-password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="welcome-password" className="pl-9 pr-10" type={showPassword ? "text" : "password"} autoComplete={mode === "signIn" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} />
                  <button type="button" className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {mode === "signUp" && <p className="text-xs leading-5 text-muted-foreground">New accounts may show Pending until a campus Admin assigns the correct role.</p>}
              {!supabaseConfigured && <p role="alert" className="text-xs text-destructive">Account access is not configured. Contact the campus administrator.</p>}
              <Button type="submit" className="mt-1 w-full gap-2" disabled={busy || !supabaseConfigured}>
                {busy ? "Please wait…" : mode === "signIn" ? "Sign in to campus" : "Create account"}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </Button>
              <p className="text-center text-xs leading-5 text-muted-foreground">
                By continuing, you agree to use campus maps responsibly and follow college access instructions.
              </p>
            </form>
          </div>
        </section>
      </main>
    </PublicPageLayout>
  );
}
