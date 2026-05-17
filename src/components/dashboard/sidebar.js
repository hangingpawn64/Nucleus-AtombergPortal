"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import {
  getAppNavigation,
  groupNavigationBySection,
} from "@/constants/navigation";
import { UserAvatar } from "@/components/profile/user-avatar";
import { ROLE_LABELS, normalizeRole } from "@/lib/auth/roles";
import { getProfileDisplayName } from "@/services/profile";
import { cn } from "@/lib/utils";

export function Sidebar({ role, profile, portalUser, onNavigate }) {
  const pathname = usePathname();
  const normalizedRole = normalizeRole(role);
  const email = portalUser?.email || "";
  const displayName = getProfileDisplayName(profile, email);
  const navigationGroups = groupNavigationBySection(
    getAppNavigation(normalizedRole),
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <BadgeCheck className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">AtomQuest Goals</p>
          <p className="text-xs text-muted-foreground">
            {ROLE_LABELS[normalizedRole]} workspace
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <p className="px-3 text-[11px] font-semibold uppercase text-muted-foreground">
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

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
          </div>
        ))}
      </nav>
      <div className="border-t p-4">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar profile={profile} email={email} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
