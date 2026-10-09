import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BookOpen, House, LifeBuoy, LogOut, MapPin, Navigation2, Sparkles } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useSecurity } from "@/security/SecurityContext";

type PublicPage = "home" | "about" | "help" | "assistant";

export default function PublicPageLayout({
  children,
  activePage,
}: {
  children: ReactNode;
  activePage: PublicPage;
}) {
  const { signedIn, role, signOut } = useSecurity();
  const links = [
    { to: "/", label: "Home", key: "home" as const, Icon: House },
    { to: "/about", label: "About", key: "about" as const, Icon: BookOpen },
    { to: "/help-desk", label: "Help Desk", key: "help" as const, Icon: LifeBuoy },
    { to: "/ai-assistant", label: "AI Assistant", key: "assistant" as const, Icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3" aria-label="AWDC Campus Navigator home">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <MapPin className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-display text-base font-bold leading-tight">AWDC Campus Navigator</span>
              <span className="block text-[11px] text-muted-foreground">Aditya Women’s Degree College · Kakinada</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1.5">
            {links.map(({ to, label, key, Icon }) => (
              <Link
                key={key}
                to={to}
                aria-current={activePage === key ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                  activePage === key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <ThemeToggle />
            {signedIn ? (
              <>
                <Link to="/campus" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:text-sm">
                  <Navigation2 className="h-4 w-4" />
                  Open Campus Map
                </Link>
                <button type="button" onClick={signOut} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-accent sm:text-sm" aria-label="Sign out" title={`Sign out (${role})`}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/" className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:text-sm">
                Sign in / Sign up
              </Link>
            )}
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-border bg-card/50 px-4 py-5 text-center text-xs text-muted-foreground">
        <p className="font-medium">© {new Date().getFullYear()} AWDC Campus Navigator. All rights reserved.</p>
        <p className="mx-auto mt-1 max-w-3xl leading-5">
          Campus navigation project prototype. Mapped routes may be approximate. Follow on-site signs and campus staff guidance; this website is not an emergency service or a live CCTV monitoring system.
        </p>
      </footer>
    </div>
  );
}
