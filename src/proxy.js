import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = ["/app"];
const authRoutes = ["/login", "/signup"];

function legacyDashboardPath(pathname) {
  if (pathname === "/dashboard") return "/app/dashboard";
  if (pathname === "/dashboard/admin") return "/app/dashboard";
  if (pathname.startsWith("/dashboard/admin/activity")) {
    return pathname.replace("/dashboard/admin/activity", "/app/audit");
  }
  if (pathname.startsWith("/dashboard/admin/cycles")) {
    return pathname.replace("/dashboard/admin/cycles", "/app/cycles");
  }
  if (pathname.startsWith("/dashboard/admin/goals")) {
    return pathname.replace("/dashboard/admin/goals", "/app/goal-progress");
  }
  if (pathname.startsWith("/dashboard/admin/reports")) {
    return pathname.replace("/dashboard/admin/reports", "/app/reports");
  }
  if (pathname.startsWith("/dashboard/admin/users")) {
    return pathname.replace("/dashboard/admin/users", "/app/users");
  }
  if (pathname.startsWith("/dashboard/check-ins")) {
    return pathname.replace("/dashboard/check-ins", "/app/checkins");
  }
  if (pathname.startsWith("/dashboard/settings")) {
    return pathname.replace("/dashboard/settings", "/app/profile");
  }

  return pathname.replace("/dashboard", "/app");
}

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const url = request.nextUrl.clone();
    url.pathname = legacyDashboardPath(pathname);
    return NextResponse.redirect(url);
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.includes(pathname);

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  return updateSession(request, { isProtectedRoute, isAuthRoute });
}

export const config = {
  matcher: ["/app/:path*", "/dashboard/:path*", "/login", "/signup"],
};
