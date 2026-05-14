import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

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
