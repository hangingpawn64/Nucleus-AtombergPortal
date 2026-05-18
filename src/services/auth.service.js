import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export async function getCurrentUser() {
  const supabase = createBrowserSupabaseClient();

  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user;
}
