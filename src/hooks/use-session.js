"use client";

import { useAuth } from "@/providers/auth-provider";

export function useSession() {
  return useAuth();
}
