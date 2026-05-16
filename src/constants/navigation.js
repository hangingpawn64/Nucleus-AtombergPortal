import {
  Activity,
  Bell,
  CalendarCheck,
  ClipboardCheck,
  FileBarChart,
  History,
  ListChecks,
  ShieldCheck,
  Users,
  Target,
} from "lucide-react";
import { ROLES, hasAnyRole, normalizeRole } from "@/lib/auth/roles";

export const dashboardNavigation = [
  {
    title: "Goals",
    href: "/dashboard/goals",
    icon: Target,
    roles: [ROLES.employee],
  },
  {
    title: "Check-ins",
    href: "/dashboard/check-ins",
    icon: CalendarCheck,
    roles: [ROLES.employee, ROLES.manager],
  },
  {
    title: "Activity",
    href: "/dashboard/activity",
    icon: Activity,
    roles: [ROLES.employee, ROLES.manager],
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    roles: [ROLES.employee],
  },
  {
    title: "Team Goals",
    href: "/dashboard/team-goals",
    icon: ListChecks,
    roles: [ROLES.manager],
  },
  {
    title: "Approvals",
    href: "/dashboard/approvals",
    icon: ClipboardCheck,
    roles: [ROLES.manager],
  },
  {
    title: "All Goals",
    href: "/dashboard/admin/goals",
    icon: Target,
    roles: [ROLES.admin],
  },
  {
    title: "Users",
    href: "/dashboard/admin/users",
    icon: Users,
    roles: [ROLES.admin],
  },
  {
    title: "Reports",
    href: "/dashboard/admin/reports",
    icon: FileBarChart,
    roles: [ROLES.admin],
  },
  {
    title: "Audit Logs",
    href: "/dashboard/admin/activity",
    icon: History,
    roles: [ROLES.admin],
  },
  {
    title: "Cycle Management",
    href: "/dashboard/admin/cycles",
    icon: ShieldCheck,
    roles: [ROLES.admin],
  },
];

export function getDashboardNavigation(role) {
  const normalizedRole = normalizeRole(role);

  return dashboardNavigation.filter((item) =>
    hasAnyRole(normalizedRole, item.roles),
  );
}
