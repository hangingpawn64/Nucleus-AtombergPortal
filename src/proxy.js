import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login", "/signup"];

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;
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
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
