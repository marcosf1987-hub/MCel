import type { SupabaseClient } from "@supabase/supabase-js";
import type { Report, ReportTargetType } from "@/types/database";

export type EnrichedReport = Report & {
  reporter_name: string | null;
  target_label: string;
  target_href: string | null;
  target_deleted: boolean;
};

export const TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  product: "Producto",
  review: "Evaluación",
  list: "Lista",
  list_comment: "Comentario de lista",
};

async function enrichTarget(
  supabase: SupabaseClient,
  targetType: ReportTargetType,
  targetId: string
): Promise<{ label: string; href: string | null; deleted: boolean }> {
  if (targetType === "product") {
    const { data } = await supabase
      .from("products")
      .select("name, slug, deleted_at")
      .eq("id", targetId)
      .maybeSingle();
    return {
      label: data?.name ?? "Producto eliminado o no encontrado",
      href: data?.slug ? `/productos/${data.slug}` : null,
      deleted: Boolean(data?.deleted_at),
    };
  }

  if (targetType === "review") {
    const { data } = await supabase
      .from("reviews")
      .select("opinion, deleted_at, product_id")
      .eq("id", targetId)
      .maybeSingle();

    if (!data) {
      return { label: "Evaluación no encontrada", href: null, deleted: true };
    }

    const { data: product } = await supabase
      .from("products")
      .select("slug, name")
      .eq("id", data.product_id)
      .maybeSingle();

    const snippet = data.opinion?.slice(0, 80) ?? "";
    return {
      label: product?.name ? `${product.name}: «${snippet}»` : snippet,
      href: product?.slug ? `/productos/${product.slug}/resenas` : null,
      deleted: Boolean(data.deleted_at),
    };
  }

  if (targetType === "list") {
    const { data } = await supabase
      .from("product_lists")
      .select("title, slug, deleted_at, user_id")
      .eq("id", targetId)
      .maybeSingle();

    if (!data) {
      return { label: "Lista no encontrada", href: null, deleted: true };
    }

    const { data: owner } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.user_id)
      .maybeSingle();

    return {
      label: data.title ?? "Lista",
      href:
        data.slug && owner?.username
          ? `/listas/${owner.username}/${data.slug}`
          : null,
      deleted: Boolean(data.deleted_at),
    };
  }

  if (targetType === "list_comment") {
    const { data } = await supabase
      .from("list_comments")
      .select("body, deleted_at, list_id")
      .eq("id", targetId)
      .maybeSingle();

    if (!data) {
      return { label: "Comentario no encontrado", href: null, deleted: true };
    }

    const { data: list } = await supabase
      .from("product_lists")
      .select("title, slug, user_id")
      .eq("id", data.list_id)
      .maybeSingle();

    let href: string | null = null;
    if (list?.slug) {
      const { data: owner } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", list.user_id)
        .maybeSingle();
      if (owner?.username) {
        href = `/listas/${owner.username}/${list.slug}`;
      }
    }

    const snippet = data.body?.slice(0, 80) ?? "";
    return {
      label: list?.title ? `${list.title}: «${snippet}»` : `«${snippet}»`,
      href,
      deleted: Boolean(data.deleted_at),
    };
  }

  return { label: "Desconocido", href: null, deleted: false };
}

export async function fetchEnrichedReports(
  supabase: SupabaseClient,
  status: Report["status"] | "all" = "pending",
  limit = 50
): Promise<EnrichedReport[]> {
  let query = supabase
    .from("reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, status, created_at, resolved_by, resolved_at, moderator_note"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data: rows } = await query;
  if (!rows?.length) return [];

  const reporterIds = [...new Set(rows.map((r) => r.reporter_id))];
  const { data: reporters } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .in("id", reporterIds);

  const reporterMap = new Map(
    (reporters ?? []).map((p) => [
      p.id,
      p.display_name ?? p.username ?? null,
    ])
  );

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const target = await enrichTarget(
        supabase,
        row.target_type as ReportTargetType,
        row.target_id
      );

      return {
        id: row.id,
        reporter_id: row.reporter_id,
        target_type: row.target_type as ReportTargetType,
        target_id: row.target_id,
        reason: row.reason,
        status: row.status as Report["status"],
        created_at: row.created_at,
        resolved_by: row.resolved_by ?? null,
        resolved_at: row.resolved_at ?? null,
        moderator_note: row.moderator_note ?? null,
        reporter_name: reporterMap.get(row.reporter_id) ?? null,
        target_label: target.label,
        target_href: target.href,
        target_deleted: target.deleted,
      };
    })
  );

  return enriched;
}
