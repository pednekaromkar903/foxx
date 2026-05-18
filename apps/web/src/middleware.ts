import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;
  
  // Public paths that don't need auth
  const publicPaths = ["/login", "/api/auth"];
  if (publicPaths.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }
  
  // If no token and trying to access protected route, redirect to login
  if (!token && path !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
