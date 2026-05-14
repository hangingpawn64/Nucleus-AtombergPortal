"use client";

import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { subscribeToTable } from "@/lib/supabase/realtime";

export function useRealtimeSubscription({ table, event = "*", filter, onChange }) {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    if (!supabase || !table || !onChange) return undefined;

    const subscription = subscribeToTable({
      supabase,
      table,
      event,
      filter,
      onChange,
    });

    return () => subscription.unsubscribe();
  }, [table, event, filter, onChange]);
}
