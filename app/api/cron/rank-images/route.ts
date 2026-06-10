import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getProductIdsForRanking,
  rankProductImages,
} from "@/lib/product-images-rank";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET no configurado." },
      { status: 500 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) return unauthorized();

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sin cliente admin";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
  const productIds = await getProductIdsForRanking(supabase, limit);

  const results: { productId: string; ok: boolean; ranked?: number; error?: string }[] = [];

  for (const productId of productIds) {
    const result = await rankProductImages(supabase, productId);
    results.push({ productId, ...result });
  }

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.length - okCount;

  return NextResponse.json({
    ok: failCount === 0,
    processed: results.length,
    succeeded: okCount,
    failed: failCount,
    results,
  });
}
