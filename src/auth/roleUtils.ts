export type RoleHome = "/admin" | "/employee";

export function getRoleHome(role: unknown): RoleHome | null {
  if (typeof role !== "string") {
    return null;
  }

  switch (role.trim().toLowerCase()) {
    case "admin":
    case "administrator":
    case "super admin":
    case "super-admin":
    case "super_admin":
    case "superadmin":
      return "/admin";
    case "employee":
      return "/employee";
    default:
      return null;
  }
}