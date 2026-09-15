import type { Role } from "@prisma/client";

export type Permission =
  | "dashboard:all"
  | "customers:read"
  | "customers:write"
  | "properties:read"
  | "properties:write"
  | "enquiries:read"
  | "enquiries:write"
  | "quotes:read"
  | "quotes:write"
  | "jobs:read"
  | "jobs:write"
  | "jobs:assign"
  | "calendar:read"
  | "calendar:write"
  | "previous:read"
  | "followups:read"
  | "followups:write"
  | "followups:approve"
  | "maintenance:read"
  | "maintenance:write"
  | "invoices:read"
  | "invoices:write"
  | "reports:read"
  | "team:read"
  | "team:write"
  | "settings:read"
  | "settings:write"
  | "search:all"
  | "grok:use";

const ALL: Permission[] = [
  "dashboard:all",
  "customers:read",
  "customers:write",
  "properties:read",
  "properties:write",
  "enquiries:read",
  "enquiries:write",
  "quotes:read",
  "quotes:write",
  "jobs:read",
  "jobs:write",
  "jobs:assign",
  "calendar:read",
  "calendar:write",
  "previous:read",
  "followups:read",
  "followups:write",
  "followups:approve",
  "maintenance:read",
  "maintenance:write",
  "invoices:read",
  "invoices:write",
  "reports:read",
  "team:read",
  "team:write",
  "settings:read",
  "settings:write",
  "search:all",
  "grok:use",
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: ALL,
  OFFICE_ADMIN: ALL.filter((p) => p !== "team:write" && p !== "settings:write"),
  SUPERVISOR: [
    "dashboard:all",
    "customers:read",
    "customers:write",
    "properties:read",
    "properties:write",
    "enquiries:read",
    "enquiries:write",
    "quotes:read",
    "jobs:read",
    "jobs:write",
    "jobs:assign",
    "calendar:read",
    "calendar:write",
    "previous:read",
    "followups:read",
    "followups:write",
    "maintenance:read",
    "maintenance:write",
    "invoices:read",
    "reports:read",
    "team:read",
    "settings:read",
    "search:all",
    "grok:use",
  ],
  PLUMBER: [
    "dashboard:all",
    "customers:read",
    "properties:read",
    "jobs:read",
    "jobs:write",
    "calendar:read",
    "calendar:write",
    "previous:read",
    "followups:read",
    "maintenance:read",
    "search:all",
    "grok:use",
  ],
  SALES: [
    "dashboard:all",
    "customers:read",
    "customers:write",
    "properties:read",
    "enquiries:read",
    "enquiries:write",
    "quotes:read",
    "quotes:write",
    "jobs:read",
    "previous:read",
    "followups:read",
    "followups:write",
    "maintenance:read",
    "reports:read",
    "settings:read",
    "search:all",
    "grok:use",
  ],
};

export function can(role: Role | undefined, permission: Permission) {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAny(role: Role | undefined, permissions: Permission[]) {
  return permissions.some((permission) => can(role, permission));
}

export function scopedToAssigned(role: Role | undefined) {
  return role === "PLUMBER";
}

export function navVisible(role: Role | undefined, href: string) {
  const map: Record<string, Permission> = {
    "/dashboard": "dashboard:all",
    "/customers": "customers:read",
    "/properties": "properties:read",
    "/enquiries": "enquiries:read",
    "/quotes": "quotes:read",
    "/jobs": "jobs:read",
    "/calendar": "calendar:read",
    "/previous-work": "previous:read",
    "/follow-ups": "followups:read",
    "/maintenance": "maintenance:read",
    "/invoices": "invoices:read",
    "/reports": "reports:read",
    "/team": "team:read",
    "/settings": "settings:read",
  };
  return can(role, map[href] ?? "dashboard:all");
}
