import { Link, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-elevated">
        <p className="mb-2 text-5xl font-bold font-display text-foreground">404</p>
        <p className="mb-2 text-xl font-semibold text-foreground">Page not found</p>
        <p className="mb-6 text-sm text-muted-foreground">
          The page <span className="font-mono">{location.pathname}</span> is not part of the campus navigator.
        </p>
        <Link
          to="/"
          className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Return to Navigator
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
