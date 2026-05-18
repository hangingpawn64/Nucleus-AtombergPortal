import { redirect } from "next/navigation";
import { ErrorState } from "@/components/empty-states/error-state";
import { ProfileForm } from "@/components/profile/profile-form";
import { ROLE_LABELS, normalizeRole } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getProfileDisplayName,
  profileColumns,
} from "@/services/profile.service";

export const metadata = {
  title: "Profile Settings | Nucleus Portal",
};

function profileFromMetadata(user) {
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);

  return {
    first_name: user?.user_metadata?.given_name || firstName,
    last_name: user?.user_metadata?.family_name || rest.join(" "),
    mobile_number: "",
    avatar_url: user?.user_metadata?.avatar_url || null,
    metadata: {},
    full_name: fullName,
  };
}

function authProviders(user) {
  const providers = (user?.identities || [])
    .map((identity) => identity.provider)
    .filter(Boolean);

  if (providers.length > 0) {
    return [...new Set(providers)];
  }

  return [user?.app_metadata?.provider || "email"].filter(Boolean);
}

async function getAccountInfo(supabase, user, portalUser) {
  const role = normalizeRole(portalUser?.role);
  const providers = authProviders(user);
  const passwordConfigured =
    providers.includes("email") || user?.app_metadata?.provider === "email";
  let managerName = null;
  let teamSize = null;

  if (role === "employee") {
    const { data: relationship } = await supabase
      .from("manager_relationships")
      .select("manager_id")
      .eq("employee_id", user.id)
      .eq("status", "active")
      .is("effective_to", null)
      .maybeSingle();

    if (relationship?.manager_id) {
      const [{ data: managerUser }, { data: managerProfile }] =
        await Promise.all([
          supabase
            .from("users")
            .select("id,email")
            .eq("id", relationship.manager_id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("id,user_id,full_name,first_name,last_name,avatar_url")
            .eq("user_id", relationship.manager_id)
            .maybeSingle(),
        ]);

      managerName = getProfileDisplayName(
        managerProfile,
        managerUser?.email || "Assigned manager",
      );
    }
  }

  if (role === "manager") {
    const { count } = await supabase
      .from("manager_relationships")
      .select("id", { count: "exact", head: true })
      .eq("manager_id", user.id)
      .eq("status", "active")
      .is("effective_to", null);

    teamSize = count || 0;
  }

  return {
    role,
    roleLabel: ROLE_LABELS[role],
    status: portalUser?.status || "active",
    createdAt: portalUser?.created_at,
    providers,
    passwordConfigured,
    managerName,
    teamSize,
  };
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return (
      <ErrorState
        title="Supabase is not configured"
        description="Add the Supabase URL and anon key before managing profiles."
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/app/profile");
  }

  const [{ data: profile, error }, { data: portalUser }] = await Promise.all([
    supabase
      .from("profiles")
      .select(profileColumns)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("users")
      .select("id,email,role,status,created_at")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (error) {
    return (
      <ErrorState
        title="Profile could not be loaded"
        description={error.message}
      />
    );
  }

  const initialProfile = profile || profileFromMetadata(user);
  const accountInfo = await getAccountInfo(supabase, user, portalUser);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account identity, picture, security, and notification preferences.
        </p>
      </div>
      <ProfileForm
        initialProfile={initialProfile}
        user={user}
        accountInfo={accountInfo}
      />
    </div>
  );
}
