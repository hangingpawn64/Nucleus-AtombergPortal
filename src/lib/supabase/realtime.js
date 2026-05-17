export function subscribeToTable({
  supabase,
  table,
  event = "*",
  schema = "public",
  filter,
  onChange,
}) {
  if (!supabase || !table || !onChange) {
    return { unsubscribe: () => undefined };
  }

  const uniqueId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const channel = supabase
    .channel(`${schema}:${table}:${filter || "all"}:${uniqueId}`)
    .on(
      "postgres_changes",
      {
        event,
        schema,
        table,
        ...(filter ? { filter } : {}),
      },
      onChange,
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel),
  };
}
