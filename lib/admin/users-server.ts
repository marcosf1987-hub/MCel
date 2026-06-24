import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/types/database";

export type AdminUserRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  app_role: AppRole;
  tier: string;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  collaboration_count: number;
  created_at: string;
  review_count: number;
};

export async function fetchAdminUsers(
  supabase: SupabaseClient,
  opts: {
    q?: string;
    role?: AppRole | "all";
    suspended?: "all" | "yes" | "no";
    limit?: number;
  } = {}
): Promise<AdminUserRow[]> {
  const limit = opts.limit ?? 50;

  let query = supabase
    .from("profiles")
    .select(
      "id, username, display_name, app_role, tier, is_suspended, suspended_at, suspended_reason, collaboration_count, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.q?.trim()) {
    const term = opts.q.trim();
    query = query.or(
      `username.ilike.%${term}%,display_name.ilike.%${term}%`
    );
  }

  if (opts.role && opts.role !== "all") {
    query = query.eq("app_role", opts.role);
  }

  if (opts.suspended === "yes") {
    query = query.eq("is_suspended", true);
  } else if (opts.suspended === "no") {
    query = query.eq("is_suspended", false);
  }

  const { data: profiles } = await query;
  if (!profiles?.length) return [];

  const ids = profiles.map((p) => p.id);

  const [{ data: reviewCounts }, emailMap] = await Promise.all([
    supabase.from("reviews").select("user_id").in("user_id", ids),
    fetchEmailsForUsers(ids),
  ]);

  const reviewMap = new Map<string, number>();
  for (const row of reviewCounts ?? []) {
    reviewMap.set(row.user_id, (reviewMap.get(row.user_id) ?? 0) + 1);
  }

  return profiles.map((p) => ({
    id: p.id,
    username: p.username,
    display_name: p.display_name,
    email: emailMap.get(p.id) ?? null,
    app_role: p.app_role as AppRole,
    tier: p.tier,
    is_suspended: p.is_suspended,
    suspended_at: p.suspended_at,
    suspended_reason: p.suspended_reason,
    collaboration_count: p.collaboration_count,
    created_at: p.created_at,
    review_count: reviewMap.get(p.id) ?? 0,
  }));
}

async function fetchEmailsForUsers(
  userIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!userIds.length) return map;

  try {
    const admin = createAdminClient();
    await Promise.all(
      userIds.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        if (data.user?.email) map.set(id, data.user.email);
      })
    );
  } catch {
    // Sin service role en dev: lista sin emails
  }

  return map;
}

export async function fetchUserEmail(userId: string): Promise<string | null> {
  const map = await fetchEmailsForUsers([userId]);
  return map.get(userId) ?? null;
}

export type GdprExport = {
  exported_at: string;
  user_id: string;
  email: string | null;
  profile: Record<string, unknown>;
  reviews: Record<string, unknown>[];
  product_lists: Record<string, unknown>[];
  list_comments: Record<string, unknown>[];
  favorites: Record<string, unknown>[];
  reports_filed: Record<string, unknown>[];
  product_images: Record<string, unknown>[];
};

export async function buildGdprExport(
  supabase: SupabaseClient,
  userId: string
): Promise<GdprExport | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  const email = await fetchUserEmail(userId);

  const [
    { data: reviews },
    { data: product_lists },
    { data: list_comments },
    { data: favorites },
    { data: reports },
    { data: product_images },
  ] = await Promise.all([
    supabase.from("reviews").select("*").eq("user_id", userId),
    supabase.from("product_lists").select("*").eq("user_id", userId),
    supabase.from("list_comments").select("*").eq("user_id", userId),
    supabase.from("favorites").select("*").eq("user_id", userId),
    supabase.from("reports").select("*").eq("reporter_id", userId),
    supabase.from("product_images").select("*").eq("user_id", userId),
  ]);

  return {
    exported_at: new Date().toISOString(),
    user_id: userId,
    email,
    profile,
    reviews: reviews ?? [],
    product_lists: product_lists ?? [],
    list_comments: list_comments ?? [],
    favorites: favorites ?? [],
    reports_filed: reports ?? [],
    product_images: product_images ?? [],
  };
}

export async function countSuspendedUsers(
  supabase: SupabaseClient
): Promise<number> {
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_suspended", true);

  return count ?? 0;
}
