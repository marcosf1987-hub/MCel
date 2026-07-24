import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";
import { createListNotification } from "@/lib/list-notifications";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  createCommentSchema,
  uuidSchema,
  zodErrorMessage,
} from "@/lib/validation/api-schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const { listId } = await params;
  if (!uuidSchema.safeParse(listId).success) {
    return listJson({ ok: false, error: "Lista inválida." }, 400);
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("list_comments")
    .select(
      `
      id, user_id, body, created_at,
      profiles (username, display_name)
    `
    )
    .eq("list_id", listId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) return listJson({ ok: false, error: error.message }, 500);

  const comments = (data ?? []).map((row) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      userId: row.user_id,
      body: row.body,
      createdAt: row.created_at,
      username: (p as { username: string | null })?.username ?? null,
      displayName: (p as { display_name: string | null })?.display_name ?? null,
    };
  });

  return listJson({ ok: true, comments });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;
  const { listId } = await params;

  if (!uuidSchema.safeParse(listId).success) {
    return listJson({ ok: false, error: "Lista inválida." }, 400);
  }

  const limited = rateLimit(`comments:create:${user.id}:${clientIp(request)}`, 20, 60_000);
  if (!limited.ok) {
    const r = rateLimitResponse(limited.retryAfterSec);
    return listJson(r.body, r.status);
  }

  const parsed = createCommentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return listJson({ ok: false, error: zodErrorMessage(parsed.error) }, 400);
  }
  const text = parsed.data.text;

  const { data: list } = await supabase
    .from("product_lists")
    .select("id, visibility, user_id")
    .eq("id", listId)
    .maybeSingle();

  if (!list) return listJson({ ok: false, error: "Lista no encontrada." }, 404);

  const { data: comment, error } = await supabase
    .from("list_comments")
    .insert({
      list_id: listId,
      user_id: user.id,
      body: text,
    })
    .select("id")
    .single();

  if (error) return listJson({ ok: false, error: error.message }, 500);

  await createListNotification(supabase, {
    recipientId: list.user_id,
    actorId: user.id,
    listId,
    type: "list_comment",
    commentId: comment.id,
  });

  return withCookies(response, listJson({ ok: true }));
}
