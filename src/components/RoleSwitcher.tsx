import { UserCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSecurity } from "@/security/SecurityContext";
import { roles } from "@/security/permissions";
import type { Role } from "@/security/types";

/** Demo role switcher — replace with the signed-in user's role once authentication exists. */
export default function RoleSwitcher() {
  const { role, setRole } = useSecurity();
  return (
    <Select value={role} onValueChange={(v) => setRole(v as Role)}>
      <SelectTrigger className="h-9 w-[132px] text-xs" aria-label="Demo role">
        <UserCircle2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
