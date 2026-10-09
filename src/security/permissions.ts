import type { Role } from "./types";

export const roles: { id: Role; label: string }[] = [
  { id: "pending", label: "Pending approval" },
  { id: "student", label: "Student" },
  { id: "faculty", label: "Faculty" },
  { id: "staff", label: "Staff" },
  { id: "management", label: "Management" },
  { id: "security", label: "Security" },
  { id: "admin", label: "Admin" },
];

export const can = {
  viewSecurity: (r: Role) => r === "security" || r === "admin" || r === "management",
  manageSecurity: (r: Role) => r === "security" || r === "admin",
  manageAccessControl: (r: Role) => r === "security" || r === "admin",
  manageVisitors: (r: Role) => r === "security" || r === "admin",
  viewCCTV: (r: Role) => r === "security" || r === "management" || r === "admin",
  manageCCTV: (r: Role) => r === "management" || r === "admin",
  viewManagement: (r: Role) => r === "management" || r === "admin",
  administer: (r: Role) => r === "admin",
};
