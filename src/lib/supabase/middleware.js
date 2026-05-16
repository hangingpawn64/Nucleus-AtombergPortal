import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  canAccessDashboardPath,
  getRoleHomePath,
  normalizeRole,
} from "@/lib/auth/roles";
import { getSupabaseConfig } from "./config";

export async function updateSession(
  request,
  { isProtectedRoute = false, isAuthRoute = false } = {},
) {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  let response = NextResponse.next({ request });

  if (!isConfigured) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isProtectedRoute && user) {
    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = normalizeRole(userRow?.role);

    if (!canAccessDashboardPath(role, request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePath(role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
