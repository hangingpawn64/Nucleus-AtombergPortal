"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, LogOut, Menu, Search, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRouteLabel } from "@/constants/navigation";
import { UserAvatar } from "@/components/profile/user-avatar";
import { useAuth } from "@/providers/auth-provider";
import { ROLE_LABELS, normalizeRole } from "@/lib/auth/roles";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function TopNav({ role, profile, portalUser, onMenuClick }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const email = user?.email || portalUser?.email || "demo@example.com";
  const normalizedRole = normalizeRole(role);
  const currentLabel = getRouteLabel(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu />
        <span className="sr-only">Open menu</span>
      </Button>
      <div className="hidden items-center gap-2 text-sm md:flex">
        <Link className="font-medium text-muted-foreground hover:text-foreground" href="/app/dashboard">
          Workspace
        </Link>
        <ChevronRight className="size-4 text-muted-foreground" />
        <span className="font-medium">{currentLabel}</span>
      </div>
      <div className="relative hidden w-full max-w-md md:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
          placeholder="Search goals, people, reports"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Button asChild variant="ghost" size="icon">
          <Link href="/app/notifications">
            <Bell />
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" className="gap-2 px-2">
              <UserAvatar profile={profile} email={email} size="md" />
              <span className="hidden max-w-40 truncate text-sm md:inline">{email}</span>
              <Badge variant="secondary" className="hidden md:inline-flex">
                {ROLE_LABELS[normalizedRole]}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/profile">
                <User />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
