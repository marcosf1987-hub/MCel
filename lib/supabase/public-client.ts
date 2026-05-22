import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Cliente sin cookies — para datos públicos dentro de unstable_cache. */
export function createPublicSupabaseClient() {
  const env = getSupabasePublicEnv();
  if (!env.ok) return null;
  return createClient(env.url, env.anonKey);
}
