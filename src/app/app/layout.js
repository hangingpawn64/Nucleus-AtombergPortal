import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { normalizeRole } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Nucleus App | Goal Setting Portal",
};

export default async function AppLayout({ children }) {
  const supabase = await createServerSupabaseClient();
  let portalUser = null;
  let profile = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?redirectTo=/app/dashboard");
    }

    const [{ data: userRow }, { data: profileRow }] = await Promise.all([
      supabase
        .from("users")
        .select("id,email,role,status")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id,user_id,full_name,first_name,last_name,avatar_url")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    portalUser = userRow || {
      id: user.id,
      email: user.email,
      role: "employee",
      status: "active",
    };
    profile = profileRow;
  }

  return (
    <DashboardShell
      role={normalizeRole(portalUser?.role)}
      profile={profile}
      portalUser={portalUser}
    >
      {children}
    </DashboardShell>
  );
}
