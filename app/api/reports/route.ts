import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REPORT_TARGET_TYPES, type ReportTargetType } from "@/types/database";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { target_type, target_id, reason } = body;

  if (!target_type || !target_id || !reason?.trim()) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  if (!REPORT_TARGET_TYPES.includes(target_type as ReportTargetType)) {
    return NextResponse.json({ error: "Tipo de reporte inválido." }, { status: 400 });
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type,
    target_id,
    reason: String(reason).trim(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
