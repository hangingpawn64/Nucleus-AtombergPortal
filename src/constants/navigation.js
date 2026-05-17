import {
  Activity,
  BarChart3,
  Bell,
  CalendarCheck,
  ClipboardCheck,
  FileBarChart,
  History,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import { ROLES, hasAnyRole, normalizeRole } from "@/lib/auth/roles";

export const appNavigation = [
  {
    title: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    section: "Workspace",
    roles: [ROLES.employee, ROLES.manager, ROLES.admin],
  },
  {
    title: "My Goals",
    href: "/app/goals",
    icon: Target,
    section: "Workflow",
    roles: [ROLES.employee],
  },
  {
    title: "My Check-ins",
    href: "/app/checkins",
    icon: CalendarCheck,
    section: "Workflow",
    roles: [ROLES.employee],
  },
  {
    title: "Team Goals",
    href: "/app/team-goals",
    icon: ListChecks,
    section: "Workflow",
    roles: [ROLES.manager],
  },
  {
    title: "Approvals",
    href: "/app/approvals",
    icon: ClipboardCheck,
    section: "Workflow",
    roles: [ROLES.manager],
  },
  {
    title: "Team Check-ins",
    href: "/app/team-checkins",
    icon: CalendarCheck,
    section: "Workflow",
    roles: [ROLES.manager],
  },
  {
    title: "Goal Cycles",
    href: "/app/cycles",
    icon: ShieldCheck,
    section: "Administration",
    roles: [ROLES.admin],
  },
  {
    title: "Users",
    href: "/app/users",
    icon: Users,
    section: "Administration",
    roles: [ROLES.admin],
  },
  {
    title: "Reports",
    href: "/app/reports",
    icon: FileBarChart,
    section: "Oversight",
    roles: [ROLES.admin],
  },
  {
    title: "Audit Logs",
    href: "/app/audit",
    icon: History,
    section: "Oversight",
    roles: [ROLES.admin],
  },
  {
    title: "Analytics",
    href: "/app/analytics",
    icon: BarChart3,
    section: "Oversight",
    roles: [ROLES.admin],
  },
  {
    title: "Activity",
    href: "/app/activity",
    icon: Activity,
    section: "Account",
    roles: [ROLES.employee, ROLES.manager, ROLES.admin],
  },
  {
    title: "Notifications",
    href: "/app/notifications",
    icon: Bell,
    section: "Account",
    roles: [ROLES.employee, ROLES.manager],
  },
  {
    title: "Profile",
    href: "/app/profile",
    icon: UserRound,
    section: "Account",
    roles: [ROLES.employee, ROLES.manager, ROLES.admin],
  },
];

export const appRouteLabels = {
  "/app": "Workspace",
  "/app/dashboard": "Dashboard",
  "/app/goals": "My Goals",
  "/app/goals/edit": "Goal Sheet",
  "/app/checkins": "My Check-ins",
  "/app/team-goals": "Team Goals",
  "/app/approvals": "Approvals",
  "/app/team-checkins": "Team Check-ins",
  "/app/cycles": "Goal Cycles",
  "/app/users": "Users",
  "/app/reports": "Reports",
  "/app/audit": "Audit Logs",
  "/app/analytics": "Analytics",
  "/app/goal-progress": "Goal Progress",
  "/app/activity": "Activity",
  "/app/notifications": "Notifications",
  "/app/profile": "Profile",
  "/app/settings": "Settings",
  "/app/unauthorized": "Unauthorized",
};

export function getAppNavigation(role) {
  const normalizedRole = normalizeRole(role);

  return appNavigation.filter((item) =>
    hasAnyRole(normalizedRole, item.roles),
  );
}

export function getDashboardNavigation(role) {
  return getAppNavigation(role);
}

export function groupNavigationBySection(items = []) {
  return items.reduce((groups, item) => {
    const existingGroup = groups.find((group) => group.title === item.section);

    if (existingGroup) {
      existingGroup.items.push(item);
      return groups;
    }

    return [...groups, { title: item.section, items: [item] }];
  }, []);
}

export function getRouteLabel(pathname = "") {
  if (appRouteLabels[pathname]) return appRouteLabels[pathname];

  const match = Object.keys(appRouteLabels)
    .filter((path) => pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];

  return appRouteLabels[match] || "Workspace";
}
