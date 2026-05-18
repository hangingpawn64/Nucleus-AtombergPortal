import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

function safeNext(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app/dashboard";
  }

  if (value === "/dashboard") return "/app/dashboard";
  if (value === "/dashboard/admin") return "/app/dashboard";
  if (value.startsWith("/dashboard/admin/activity")) {
    return value.replace("/dashboard/admin/activity", "/app/audit");
  }
  if (value.startsWith("/dashboard/admin/cycles")) {
    return value.replace("/dashboard/admin/cycles", "/app/cycles");
  }
  if (value.startsWith("/dashboard/admin/goals")) {
    return value.replace("/dashboard/admin/goals", "/app/goal-progress");
  }
  if (value.startsWith("/dashboard/admin/reports")) {
    return value.replace("/dashboard/admin/reports", "/app/reports");
  }
  if (value.startsWith("/dashboard/admin/users")) {
    return value.replace("/dashboard/admin/users", "/app/users");
  }
  if (value.startsWith("/dashboard/check-ins")) {
    return value.replace("/dashboard/check-ins", "/app/checkins");
  }
  if (value.startsWith("/dashboard/settings")) {
    return value.replace("/dashboard/settings", "/app/profile");
  }
  if (value.startsWith("/dashboard/")) {
    return value.replace("/dashboard", "/app");
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

  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("auth_error", "Supabase is not configured.");
    return NextResponse.redirect(redirectUrl);
  }

  // Create the redirect response object first so we can attach Set-Cookie headers to it
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("auth_error", error.message);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
