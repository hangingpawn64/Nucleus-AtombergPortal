import { createRecord, listRecords } from "./crud";

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
