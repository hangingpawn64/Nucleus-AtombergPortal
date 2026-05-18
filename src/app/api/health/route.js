import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function GET() {
  const { isConfigured } = getSupabaseConfig();

  return NextResponse.json({
    ok: true,
    service: "nucleus-portal",
    supabaseConfigured: isConfigured,
    timestamp: new Date().toISOString(),
  });
}
