"use client";

import { Bell, LogOut, Menu, Moon, Search, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/shared/auth-provider";
import { initialsFromEmail } from "@/lib/utils";

export function TopNav({ onMenuClick }) {
  const { user, signOut } = useAuth();
  const email = user?.email || "demo@example.com";

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
      <div className="relative hidden w-full max-w-md md:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
          placeholder="Search placeholder"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon">
          <Bell />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Theme toggle placeholder">
          <Moon />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" className="gap-2 px-2">
              <Avatar>
                <AvatarFallback>{initialsFromEmail(email)}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-40 truncate text-sm md:inline">{email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User />
              Profile placeholder
            </DropdownMenuItem>
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
