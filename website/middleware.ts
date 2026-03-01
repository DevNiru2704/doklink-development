import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");
  const isLandingPage = request.nextUrl.pathname === "/";
  
  // Redirect signup to login (removed public signup)
  if (request.nextUrl.pathname.startsWith("/signup")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow auth API routes
  if (isApiAuth) {
    return NextResponse.next();
  }

  // Allow access to landing page without authentication
  if (isLandingPage) {
    return NextResponse.next();
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If on login page and already authenticated, redirect to dashboard
    if (isAuthPage && token) {
      if (token.role === "SuperAdmin") {
        return NextResponse.redirect(new URL("/superadmin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Allow access to login page
    if (isAuthPage) {
      return NextResponse.next();
    }

    // Protect all other routes - require authentication
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Add hospital context to headers for API routes
    const response = NextResponse.next();
    if (token.hospitalId) {
      response.headers.set("x-hospital-id", token.hospitalId as string);
    }
    if (token.id) {
      response.headers.set("x-user-id", token.id as string);
    }
    if (token.role) {
      response.headers.set("x-user-role", token.role as string);
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, redirect to login for protected routes
    if (!isAuthPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
