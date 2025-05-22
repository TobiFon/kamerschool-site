import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const PROTECTED_PATHS = ["/dashboard"];
const PUBLIC_FILE = /\.(.*)$/;
// Updated pattern to include metadata assets
const ASSETS_PATTERN =
  /^\/(mockups|images|videos|opengraph-image|favicon|icon|apple-icon|site\.webmanifest)/;

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and metadata assets
  if (PUBLIC_FILE.test(pathname) && ASSETS_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  // Skip middleware for public metadata assets at root level
  if (ASSETS_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  // Initialize intl middleware first for locale detection
  const intlMiddleware = createIntlMiddleware(routing);

  // The locale is found in the first path segment
  const locale = pathname.split("/")[1] || routing.defaultLocale;

  // Apply authentication check for protected paths
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(`/${locale}${path}`)
  );

  if (isProtectedPath) {
    const accessToken = request.cookies.get("access")?.value;
    const refreshToken = request.cookies.get("refresh")?.value;
    if (!accessToken || !refreshToken || isTokenExpired(accessToken)) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    const response = intlMiddleware(request);
    response.headers.set("Authorization", `Bearer ${accessToken}`);
    return response;
  }

  // Use intl middleware for non-protected routes
  return intlMiddleware(request);
}

export const config = {
  // Include assets paths in the matcher to ensure they go through the middleware
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
