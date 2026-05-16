export const ROLES = {
  employee: "employee",
  manager: "manager",
  admin: "admin",
};

export const ROLE_LABELS = {
  [ROLES.employee]: "Employee",
  [ROLES.manager]: "Manager",
  [ROLES.admin]: "Admin",
};

export const WORKFLOW_ROLES = Object.values(ROLES);

export function normalizeRole(role) {
  if (role === "member") return ROLES.employee;
  return WORKFLOW_ROLES.includes(role) ? role : ROLES.employee;
}

export function isEmployee(role) {
  return normalizeRole(role) === ROLES.employee;
}

export function isManager(role) {
  return normalizeRole(role) === ROLES.manager;
}

export function isAdmin(role) {
  return normalizeRole(role) === ROLES.admin;
}

export function hasAnyRole(role, allowedRoles = []) {
  return allowedRoles.includes(normalizeRole(role));
}

const adminOnlyPrefixes = ["/dashboard/admin"];
const managerPrefixes = ["/dashboard/team-goals", "/dashboard/approvals"];

export function canAccessDashboardPath(role, pathname = "") {
  const normalizedRole = normalizeRole(role);

  if (adminOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return isAdmin(normalizedRole);
  }

  if (managerPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return isManager(normalizedRole) || isAdmin(normalizedRole);
  }

  return true;
}

export function getRoleHomePath(role) {
  if (isAdmin(role)) return "/dashboard/admin";
  if (isManager(role)) return "/dashboard/team-goals";
  return "/dashboard";
}
