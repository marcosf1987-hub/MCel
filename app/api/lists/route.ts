import { NextRequest } from "next/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";
import { resolveUniqueListSlug } from "@/lib/lists";
import type { ListVisibility } from "@/types/database";

const VIS: ListVisibility[] = ["public", "unlisted", "private"];

export async function GET(request: NextRequest) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;

  const productId = request.nextUrl.searchParams.get("productId")?.trim();

  const { data, error } = await supabase
    .from("product_lists")
    .select("id, title, slug, description, visibility, is_system, vote_count, created_at, updated_at")
    .eq("user_id", user.id)
    .order("is_system", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) return listJson({ ok: false, error: error.message }, 500);

  let containingListIds: string[] = [];
  if (productId && data?.length) {
    const listIds = data.map((l) => l.id);
    const { data: items } = await supabase
      .from("product_list_items")
      .select("list_id")
      .eq("product_id", productId)
      .in("list_id", listIds);
    containingListIds = (items ?? []).map((i) => i.list_id);
  }

  return withCookies(
    response,
    listJson({ ok: true, lists: data ?? [], containingListIds })
  );
}

export async function POST(request: NextRequest) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    visibility?: ListVisibility;
  };

  const title = String(body.title ?? "").trim();
  if (!title) return listJson({ ok: false, error: "El título es obligatorio." }, 400);

  const visibility = VIS.includes(body.visibility as ListVisibility)
    ? (body.visibility as ListVisibility)
    : "private";

  const slug = await resolveUniqueListSlug(supabase, user.id, title);

  const { data, error } = await supabase
    .from("product_lists")
    .insert({
      user_id: user.id,
      title,
      slug,
      description: String(body.description ?? "").trim() || null,
      visibility,
      is_system: false,
    })
    .select("id, slug, title, visibility")
    .single();

  if (error) return listJson({ ok: false, error: error.message }, 500);

  return withCookies(response, listJson({ ok: true, list: data }));
}
