"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { getDashboardNavigation } from "@/constants/navigation";
import { ROLE_LABELS, normalizeRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

export function Sidebar({ role, onNavigate }) {
  const pathname = usePathname();
  const normalizedRole = normalizeRole(role);
  const navigation = getDashboardNavigation(normalizedRole);

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <BadgeCheck className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">AtomQuest Portal</p>
          <p className="text-xs text-muted-foreground">
            {ROLE_LABELS[normalizedRole]} workspace
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              prefetch={false}
              aria-disabled={item.disabled}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                item.disabled && "pointer-events-none opacity-50",
              )}
            >
              <Icon className="size-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
