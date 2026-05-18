"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { notify } from "@/lib/toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const hasSupabaseConfig = getSupabaseConfig().isConfigured;
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signOut = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      notify.error("Supabase environment variables are missing.");
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      notify.error(error.message);
      return;
    }

    notify.success("Signed out");
    router.push("/login");
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({
      session,
      user,
      isLoading,
      isConfigured: hasSupabaseConfig,
      signOut,
    }),
    [session, user, isLoading, hasSupabaseConfig, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
