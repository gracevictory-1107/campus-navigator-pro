import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, House, LifeBuoy, LogOut, Navigation2, Sparkles } from "lucide-react";
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
  const reduceMotion = Boolean(useReducedMotion());
  const links = [
    { to: "/", label: "Home", key: "home" as const, Icon: House },
    { to: "/about", label: "About", key: "about" as const, Icon: BookOpen },
    { to: "/help-desk", label: "Help Desk", key: "help" as const, Icon: LifeBuoy },
    { to: "/ai-assistant", label: "AI Assistant", key: "assistant" as const, Icon: Sparkles },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="AWDC Campus Navigator home">
            <span className="grid h-10 w-[76px] shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white p-1 shadow-sm">
              <img
                src="https://sat.aditya.ac.in/registration/assets/images/aditya-logo.png"
                alt="Aditya Educational Institutions logo"
                className="h-full w-full object-contain"
                loading="eager"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold leading-tight sm:text-base">AWDC Campus Navigator</span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">Aditya Women’s Degree College · Kakinada</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
            {links.map(({ to, label, key, Icon }) => (
              <Link
                key={key}
                to={to}
                aria-current={activePage === key ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 sm:px-3 sm:py-2 sm:text-sm ${
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
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.32, ease: "easeOut" }}
      >
        {children}
      </motion.div>
      <footer className="border-t border-border bg-card/40 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-7">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <Link to="/" className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <Navigation2 className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">AWDC Campus Navigator</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Explore campus buildings, rooms, and routes.</span>
            </span>
          </Link>

          <div className="grid gap-3 md:justify-items-end">
            <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
              {links.map(({ to, label, key }) => (
                <Link key={key} to={to} className="transition-colors hover:text-primary focus-visible:text-primary">
                  {label}
                </Link>
              ))}
            </nav>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} AWDC Campus Navigator <span className="mx-1.5 text-border">•</span> Campus prototype
            </p>
          </div>

          <p className="border-t border-border/70 pt-3 text-[11px] leading-5 text-muted-foreground md:col-span-2">
            Some mapped routes may need on-site confirmation. For emergencies, contact campus staff or local emergency services. Live CCTV monitoring is not available through this prototype.
          </p>
        </div>
      </footer>
    </div>
  );
}
