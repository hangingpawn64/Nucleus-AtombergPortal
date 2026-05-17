"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeSubscription } from "@/hooks/use-realtime";

export function ProfileRealtimeSync({ userId }) {
  const router = useRouter();
  const handleProfileChange = useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeSubscription({
    table: "profiles",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onChange: handleProfileChange,
  });

  return null;
}
