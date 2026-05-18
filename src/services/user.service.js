import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function getClient(supabaseClient) {
  const supabase = supabaseClient || createBrowserSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function fullName(profile, fallbackEmail) {
  const name = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || profile?.full_name || fallbackEmail || "Unassigned user";
}

export const UserService = {
  async listUsersForAdmin(supabaseClient) {
    const supabase = getClient(supabaseClient);
    const [usersResult, profilesResult, relationshipsResult] = await Promise.all([
      supabase
        .from("users")
        .select("id,email,role,status,created_at,updated_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id,user_id,full_name,first_name,last_name,avatar_url"),
      supabase
        .from("manager_relationships")
        .select("id,employee_id,manager_id,status,effective_from,effective_to")
        .eq("status", "active")
        .is("effective_to", null),
    ]);

    if (usersResult.error) throw usersResult.error;
    if (profilesResult.error) throw profilesResult.error;
    if (relationshipsResult.error) throw relationshipsResult.error;

    const users = usersResult.data || [];
    const profiles = profilesResult.data || [];
    const relationships = relationshipsResult.data || [];

    const profilesByUserId = new Map(
      profiles.map((profile) => [profile.user_id, profile]),
    );
    const relationshipByEmployeeId = new Map(
      relationships.map((relationship) => [relationship.employee_id, relationship]),
    );

    return users.map((user) => {
      const profile = profilesByUserId.get(user.id) || null;

      return {
        ...user,
        profile,
        name: fullName(profile, user.email),
        manager_id: relationshipByEmployeeId.get(user.id)?.manager_id || null,
      };
    });
  },

  async updateUser(userId, values, supabaseClient) {
    const supabase = getClient(supabaseClient);
    const { data, error } = await supabase
      .from("users")
      .update(values)
      .eq("id", userId)
      .select("id,email,role,status,created_at,updated_at")
      .single();

    if (error) throw error;
    return data;
  },

  async assignManager(employeeId, managerId, supabaseClient) {
    const supabase = getClient(supabaseClient);
    const { data, error } = await supabase.rpc("assign_employee_manager", {
      p_employee_id: employeeId,
      p_manager_id: managerId || null,
    });

    if (error) throw error;
    return data;
  },
};
