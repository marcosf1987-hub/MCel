import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const env = getSupabasePublicEnv();
  if (!env.ok) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (
    user &&
    (path.startsWith("/admin") ||
      path.startsWith("/cuenta") ||
      path.startsWith("/api/admin"))
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_suspended, app_role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_suspended) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "Cuenta suspendida");
      return NextResponse.redirect(url);
    }

    if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
      const staffRoles = ["moderator", "admin", "superadmin"];
      if (!profile?.app_role || !staffRoles.includes(profile.app_role)) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("error", "sin_permisos_admin");
        return NextResponse.redirect(url);
      }
    }
  }

  const needsAuth =
    path === "/productos/nuevo" ||
    path.endsWith("/evaluar") ||
    path.endsWith("/resenas") ||
    path.startsWith("/cuenta");

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnUrl", path);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin(.*)",
    "/api/admin(.*)",
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
