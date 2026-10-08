import { NavLink, useNavigate } from "react-router-dom";
import { X, ShieldCheck, LogOut, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Shared top bar for staff pages. Includes the Dashboard X/Close button,
 * light/dark toggle, role-aware navigation and sign-out.
 */
export default function SecurityHeader({ title }: { title: string }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs px-2.5 py-1.5 rounded-md transition-colors ${
      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
    }`;

  return (
    <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-card shadow-soft flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-base font-bold leading-tight text-foreground truncate">{title}</h1>
          <p className="text-[11px] text-muted-foreground truncate">
            {profile?.full_name} · <span className="capitalize">{role}</span>
          </p>
        </div>
      </div>

      <nav className="flex items-center gap-1 order-3 w-full md:order-2 md:w-auto overflow-x-auto no-scrollbar">
        {(role === "security" || role === "admin" || role === "management") && (
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        )}
        {(role === "security" || role === "admin") && (
          <NavLink to="/visitors" className={linkClass}>Visitors</NavLink>
        )}
        {role === "admin" && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
        <NavLink to="/" className={linkClass}>
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> Navigator</span>
        </NavLink>
      </nav>

      <div className="flex items-center gap-1.5 order-2 md:order-3">
        <ThemeToggle />
        <Button variant="outline" size="sm" className="h-9 gap-1.5"
          onClick={() => { signOut(); navigate("/login", { replace: true }); }}>
          <LogOut className="h-3.5 w-3.5" />
          <span className="text-xs hidden sm:inline">Sign out</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Close dashboard" onClick={() => navigate("/")}>
          <X className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
