import {
  Activity,
  BarChart3,
  LayoutDashboard,
  Settings,
  Users,
  Target,
} from "lucide-react";

export const dashboardNavigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Goals",
    href: "/dashboard/goals",
    icon: Target,
  },
  {
    title: "Users",
    href: "/dashboard/admin/users",
    icon: Users,
  },
  {
    title: "Activity",
    href: "/dashboard/admin/activity",
    icon: Activity,
  },
  {
    title: "Analytics",
    href: "/dashboard/admin",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];
