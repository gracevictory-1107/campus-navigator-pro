import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { LoaderCircle, MapPin } from "lucide-react";
import CampusNavigator from "@/components/CampusNavigator";
import { getAuthenticatedRole } from "@/lib/supabase";

/** Keep the sign-in page public; verify auth before rendering the map route. */
export default function Campus() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasCampusAccount, setHasCampusAccount] = useState(false);

  useEffect(() => {
    let active = true;
    void getAuthenticatedRole()
      .then((role) => {
        if (active) setHasCampusAccount(Boolean(role));
      })
      .catch(() => {
        if (active) setHasCampusAccount(false);
      })
      .finally(() => {
        if (active) setCheckingAccess(false);
      });
    return () => { active = false; };
  }, []);

  if (checkingAccess) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div className="grid justify-items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <MapPin className="h-6 w-6" />
          </span>
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Checking your campus session…</p>
        </div>
      </main>
    );
  }

  return hasCampusAccount ? <CampusNavigator /> : <Navigate to="/" replace />;
}
