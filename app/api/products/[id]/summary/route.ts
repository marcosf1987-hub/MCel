import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session-profile";
import { refreshProductAiSummary } from "@/lib/ai/refresh-product-summary";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { uuidSchema } from "@/lib/validation/api-schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const limited = rateLimit(`summary:${user.id}:${clientIp(request)}`, 10, 60_000);
  if (!limited.ok) {
    const r = rateLimitResponse(limited.retryAfterSec);
    return NextResponse.json(r.body, { status: r.status, headers: r.headers });
  }

  const force = request.nextUrl.searchParams.get("force") === "1";
  if (force) {
    const auth = await requireRole(supabase, "moderator");
    if (!auth.ok) {
      return NextResponse.json(
        { error: "Sin permisos para regenerar el resumen." },
        { status: 403 }
      );
    }
  }

  const result = await refreshProductAiSummary(supabase, id, { force });
  if (result.error === "not_found") {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }
  if (result.error) {
    return NextResponse.json(
      { error: "No se pudo guardar el resumen." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    summary: result.summary,
    ...(result.cached ? { cached: true } : {}),
  });
}
