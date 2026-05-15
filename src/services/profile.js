import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const profileColumns =
  "id,user_id,full_name,first_name,last_name,mobile_number,avatar_url,created_at,updated_at";

function cleanOptional(value) {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

export function getProfileDisplayName(profile, fallbackEmail) {
  const name = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || profile?.full_name || fallbackEmail || "Portal user";
}

export function getProfileInitials(profile, fallbackEmail) {
  const fromName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (fromName) return fromName;

  return (
    fallbackEmail
      ?.split("@")[0]
      .split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export async function updateCurrentUserProfile(values) {
  const supabase = createBrowserSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase environment variables are missing.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be signed in to update your profile.");

  const firstName = values.first_name.trim();
  const lastName = values.last_name.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        mobile_number: cleanOptional(values.mobile_number),
      },
      { onConflict: "user_id" },
    )
    .select(profileColumns)
    .single();

  if (error) throw error;
  return data;
}

export { profileColumns };
