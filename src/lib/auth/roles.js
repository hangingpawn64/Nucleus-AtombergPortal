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

const ROLE_HOME_PATH = "/app/dashboard";

const protectedRouteRules = [
  {
    prefix: "/app/team-goals",
    roles: [ROLES.manager],
  },
  {
    prefix: "/app/approvals",
    roles: [ROLES.manager],
  },
  {
    prefix: "/app/team-checkins",
    roles: [ROLES.manager],
  },
  {
    prefix: "/app/goals",
    roles: [ROLES.employee],
  },
  {
    prefix: "/app/checkins",
    roles: [ROLES.employee],
  },
  {
    prefix: "/app/cycles",
    roles: [ROLES.admin],
  },
  {
    prefix: "/app/users",
    roles: [ROLES.admin],
  },
  {
    prefix: "/app/reports",
    roles: [ROLES.employee, ROLES.manager, ROLES.admin],
  },
  {
    prefix: "/app/audit",
    roles: [ROLES.admin],
  },
  {
    prefix: "/app/analytics",
    roles: [ROLES.admin],
  },
  {
    prefix: "/app/goal-progress",
    roles: [ROLES.admin],
  },
];

const sharedAppPrefixes = [
  "/app",
  "/app/dashboard",
  "/app/activity",
  "/app/notifications",
  "/app/profile",
  "/app/settings",
  "/app/unauthorized",
];

export function canAccessAppPath(role, pathname = "") {
  const normalizedRole = normalizeRole(role);

  if (!pathname.startsWith("/app")) {
    return true;
  }

  if (isAdmin(normalizedRole)) {
    return true;
  }

  const rule = protectedRouteRules
    .filter(
      (item) =>
        pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
    )
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (rule) {
    return hasAnyRole(normalizedRole, rule.roles);
  }

  if (pathname === "/app") {
    return true;
  }

  return sharedAppPrefixes.some(
    (prefix) =>
      prefix !== "/app" &&
      (pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );
}

export function canAccessDashboardPath(role, pathname = "") {
  return canAccessAppPath(role, pathname.replace(/^\/dashboard/, "/app"));
}

export function getRoleHomePath() {
  return ROLE_HOME_PATH;
}
