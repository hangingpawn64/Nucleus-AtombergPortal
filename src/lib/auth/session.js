import { normalizeRole } from "./roles";

export async function getCurrentPortalUser(supabase) {
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("id,email,role,status")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    status: userRow?.status || "active",
    ...userRow,
    role: normalizeRole(userRow?.role),
  };
}
