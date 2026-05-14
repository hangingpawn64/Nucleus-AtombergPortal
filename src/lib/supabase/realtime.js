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

  const channel = supabase
    .channel(`${schema}:${table}:${filter || "all"}`)
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
