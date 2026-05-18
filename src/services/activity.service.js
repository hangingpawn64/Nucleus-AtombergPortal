import { createRecord, listRecords } from "./crud.service";

export async function hydrateActivityActors(logs = [], supabaseClient) {
  if (!logs.length || !supabaseClient) return logs;

  const actorIds = [...new Set(logs.map((log) => log.actor_id).filter(Boolean))];

  if (!actorIds.length) {
    return logs.map((log) => ({ ...log, actor: null }));
  }

  const [usersResult, profilesResult] = await Promise.all([
    supabaseClient
      .from("users")
      .select("id,email,role")
      .in("id", actorIds),
    supabaseClient
      .from("profiles")
      .select("id,user_id,full_name,first_name,last_name,avatar_url")
      .in("user_id", actorIds),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const profilesByUserId = new Map(
    (profilesResult.data || []).map((profile) => [profile.user_id, profile]),
  );
  const usersById = new Map(
    (usersResult.data || []).map((user) => [
      user.id,
      { ...user, profile: profilesByUserId.get(user.id) || null },
    ]),
  );

  return logs.map((log) => ({
    ...log,
    actor: usersById.get(log.actor_id) || null,
  }));
}

export function listActivityLogs(options = {}, supabaseClient) {
  return listRecords(
    "activity_logs",
    {
      limit: 50,
      ...options,
    },
    supabaseClient,
  );
}

export function createActivityLog(payload, supabaseClient) {
  return createRecord("activity_logs", payload, supabaseClient);
}
