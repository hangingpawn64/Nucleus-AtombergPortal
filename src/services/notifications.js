import { createRecord, listRecords, updateRecord } from "./crud";

export function listNotifications(userId, supabaseClient) {
  return listRecords(
    "notifications",
    {
      filters: userId ? [{ column: "user_id", value: userId }] : [],
      limit: 20,
    },
    supabaseClient,
  );
}

export function createNotification(payload, supabaseClient) {
  return createRecord("notifications", payload, supabaseClient);
}

export function markNotificationRead(id, supabaseClient) {
  return updateRecord(
    "notifications",
    id,
    { read_at: new Date().toISOString() },
    supabaseClient,
  );
}
