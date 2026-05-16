import { redirect } from "next/navigation";
import { ErrorState } from "@/components/shared/error-state";
import { ProfileForm } from "@/components/profile/profile-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Profile | AtomQuest Portal",
};

const profileColumns =
  "id,user_id,full_name,first_name,last_name,mobile_number,avatar_url,created_at,updated_at";

function profileFromMetadata(user) {
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);

  return {
    first_name: user?.user_metadata?.given_name || firstName,
    last_name: user?.user_metadata?.family_name || rest.join(" "),
    mobile_number: "",
    avatar_url: user?.user_metadata?.avatar_url || null,
    full_name: fullName,
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
    redirect("/login?redirectTo=/dashboard/profile");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(profileColumns)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <ErrorState
        title="Profile could not be loaded"
        description={error.message}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account identity and contact details.
        </p>
      </div>
      <ProfileForm initialProfile={profile || profileFromMetadata(user)} user={user} />
    </div>
  );
}
