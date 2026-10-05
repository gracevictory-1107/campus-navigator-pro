import { UserCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSecurity } from "@/security/SecurityContext";
import { roles } from "@/security/permissions";
import type { Role } from "@/security/types";

export default function RoleSwitcher({ onRoleChange }: { onRoleChange?: (role: Role) => void }) {
  const { role, setRole } = useSecurity();
  return (
    <Select value={role} onValueChange={(value) => {
      const selectedRole = value as Role;
      setRole(selectedRole);
      onRoleChange?.(selectedRole);
    }}>
      <SelectTrigger className="h-9 w-full text-xs" aria-label="Sign in role">
        <UserCircle2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
