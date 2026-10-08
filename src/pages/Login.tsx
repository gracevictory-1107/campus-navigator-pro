import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_ACCOUNTS, type Role } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";

const homeForRole: Record<Role, string> = {
  student: "/",
  faculty: "/",
  staff: "/",
  management: "/dashboard",
  security: "/dashboard",
  admin: "/admin",
};

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doSignIn = async (em: string, pw: string) => {
    setBusy(true);
    setError(null);
    try {
      const user = await signIn(em, pw);
      navigate(homeForRole[user.role] ?? "/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void doSignIn(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-xl">AWDC Campus Navigator</CardTitle>
          <CardDescription>Smart navigation &amp; security management</CardDescription>
          <div className="mt-2 flex justify-center">
            <Badge variant="outline" className="text-[10px] gap-1">
              <ShieldCheck className="h-3 w-3" />
              Node.js + PostgreSQL backend
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                autoComplete="username"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campus.edu"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span className={busy ? "ml-2" : ""}>Sign in</span>
            </Button>
          </form>

          <div className="mt-6">
            <p className="text-xs text-muted-foreground text-center mb-2">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <Button
                  key={a.email}
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  className="justify-start"
                  onClick={() => doSignIn(a.email, a.password)}
                >
                  <span className="font-medium">{a.label}</span>
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-3">
              Students &amp; faculty see navigation only. Security sees visitor management,
              alerts, CCTV &amp; live location. Admin manages users, locations &amp; access rules.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
