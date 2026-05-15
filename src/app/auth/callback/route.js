import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeNext(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));
  const authError =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");

  if (authError) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("auth_error", authError);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("auth_error", "Authentication link is invalid or expired.");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("auth_error", "Supabase is not configured.");
    return NextResponse.redirect(redirectUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("auth_error", error.message);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
