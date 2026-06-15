import type { AppRole } from "@/types/database";

const ROLE_RANK: Record<AppRole, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
  superadmin: 3,
};

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  user: "Usuario",
  moderator: "Moderador",
  admin: "Administrador",
  superadmin: "Superadmin",
};

export function hasMinRole(role: AppRole, minimum: AppRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canAccessAdminPanel(role: AppRole): boolean {
  return hasMinRole(role, "moderator");
}

export function canModerateContent(role: AppRole): boolean {
  return hasMinRole(role, "moderator");
}

export function canManageCatalog(role: AppRole): boolean {
  return hasMinRole(role, "admin");
}

export function canManageUsers(role: AppRole): boolean {
  return hasMinRole(role, "admin");
}

export function canAssignRoles(role: AppRole): boolean {
  return role === "superadmin";
}
