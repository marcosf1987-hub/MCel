import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/** Cliente Supabase para Route Handlers (lee cookies del request). */
export function createClientFromRequest(
  request: NextRequest,
  response: NextResponse
) {
  const env = getSupabasePublicEnv();
  if (!env.ok) {
    throw new Error(env.error);
  }

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}
