"use client";

import { useAuth } from "@/components/shared/auth-provider";

export function useSession() {
  return useAuth();
}
