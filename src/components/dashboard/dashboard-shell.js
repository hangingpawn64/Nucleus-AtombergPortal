"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUiStore } from "@/store/ui-store";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

export function DashboardShell({ children, role, profile, portalUser }) {
  const { isSidebarOpen, closeSidebar, openSidebar } = useUiStore();

  return (
    <div className="min-h-dvh bg-muted/30">
      <div className="hidden md:fixed md:inset-y-0 md:flex">
        <Sidebar role={role} />
      </div>
      <Dialog open={isSidebarOpen} onOpenChange={closeSidebar}>
        <DialogContent className="left-0 top-0 h-dvh w-64 max-w-none translate-x-0 translate-y-0 rounded-none p-0 sm:max-w-none">
          <Sidebar role={role} onNavigate={closeSidebar} />
        </DialogContent>
      </Dialog>
      <div className="md:pl-64">
        <TopNav
          role={role}
          profile={profile}
          portalUser={portalUser}
          onMenuClick={openSidebar}
        />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
