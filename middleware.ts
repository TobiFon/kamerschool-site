// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { User } from "./types/auth";

const PUBLIC_FILE = /\.(.*)$/;
const ASSETS_PATTERN =
  /^\/(mockups|images|videos|opengraph-image|favicon|icon|apple-icon|site\.webmanifest)/;

// Define all protected path prefixes
const SCHOOL_DASHBOARD_PATHS = ["/dashboard"];
const ADMIN_DASHBOARD_PATHS = ["/admin"];

async function fetchUserFromRequest(
  request: NextRequest
): Promise<User | null> {
  try {
    const apiUrl = process.env.INTERNAL_API_URL;

    // Forward the cookies from the original request
    const cookieHeader = request.headers.get("cookie");

    const res = await fetch(`${apiUrl}/users/auth/users/me/`, {
      method: "GET",
      headers: cookieHeader
        ? {
            Cookie: cookieHeader,
            "Content-Type": "application/json",
          }
        : {
            "Content-Type": "application/json",
          },
    });

    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Middleware: Error fetching user:", error);
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and metadata assets
  if (PUBLIC_FILE.test(pathname) || ASSETS_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  // Initialize intl middleware for locale handling - this MUST happen first
  const intlMiddleware = createIntlMiddleware(routing);

  // Get the locale from the pathname - handle both with and without locale prefix
  const pathSegments = pathname.split("/").filter(Boolean);
  const potentialLocale = pathSegments[0];
  const isValidLocale = routing.locales.includes(potentialLocale as any);

  const locale = isValidLocale ? potentialLocale : routing.defaultLocale;
  const pathWithoutLocale = isValidLocale
    ? "/" + pathSegments.slice(1).join("/")
    : pathname;

  // Check if the path is a protected admin path
  const isAdminPath = ADMIN_DASHBOARD_PATHS.some((path) =>
    pathWithoutLocale.startsWith(path)
  );

  // Check if the path is a protected school dashboard path (but not admin)
  const isSchoolPath =
    !isAdminPath &&
    SCHOOL_DASHBOARD_PATHS.some((path) => pathWithoutLocale.startsWith(path));

  // If it's not a protected path, just use intl middleware
  if (!isAdminPath && !isSchoolPath) {
    return intlMiddleware(request);
  }

  // --- From here, we are dealing with a protected path ---

  // Fetch user data based on the request's cookies
  const user = await fetchUserFromRequest(request);

  // If there's no valid user, redirect to login with proper locale
  if (!user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // --- User is logged in, now check for correct permissions ---

  // If trying to access an ADMIN path...
  if (isAdminPath) {
    // ...but is NOT a superuser, redirect them to appropriate dashboard or login
    if (!user.is_superuser) {
      // If they're a school user, redirect to their dashboard
      if (user.user_type === "school" || user.user_type === "school_staff") {
        const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
        return NextResponse.redirect(dashboardUrl);
      }
      // Otherwise redirect to login
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If trying to access a SCHOOL path...
  if (isSchoolPath) {
    // ...but is NOT a school/staff user, redirect them.
    if (user.user_type !== "school" && user.user_type !== "school_staff") {
      // If they're a superuser, redirect to admin dashboard
      if (user.is_superuser) {
        const adminUrl = new URL(`/${locale}/admin/dashboard`, request.url);
        return NextResponse.redirect(adminUrl);
      }
      // Otherwise redirect to login
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If all checks pass, use intl middleware to handle the request
  return intlMiddleware(request);
}

export const config = {
  // Keep the original matcher that excludes API routes
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
