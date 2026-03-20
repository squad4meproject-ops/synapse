import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication (without locale prefix)
const protectedPaths = ["/profile", "/bookmarks"];

function isProtectedPath(pathname: string): boolean {
  // Strip locale prefix (e.g. /en/profile -> /profile)
  const withoutLocale = pathname.replace(/^\/(en|fr|es)/, "");
  return protectedPaths.some((p) => withoutLocale === p || withoutLocale.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  // Run intl middleware first (handles locale redirect)
  const response = intlMiddleware(request);

  // Only check auth for protected paths
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return response;
  }

  // Create Supabase client using request/response cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Extract locale from path, default to "en"
    const localeMatch = request.nextUrl.pathname.match(/^\/(en|fr|es)/);
    const locale = localeMatch ? localeMatch[1] : "en";

    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
