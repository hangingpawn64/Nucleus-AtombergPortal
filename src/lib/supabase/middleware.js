import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  canAccessAppPath,
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
    url.pathname = getRoleHomePath();
    return NextResponse.redirect(url);
  }

  if (isProtectedRoute && user) {
    const roleCookieName = `nucleus-role-${user.id}`;
    let role = request.cookies.get(roleCookieName)?.value;

    if (!role) {
      const { data: userRow } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role = normalizeRole(userRow?.role);

      // Write cookie to response so it is cached for future page views
      response.cookies.set(roleCookieName, role, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: false,
        secure: true,
        sameSite: "lax",
      });
    }

    if (!canAccessAppPath(role, request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/unauthorized";
      url.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}
