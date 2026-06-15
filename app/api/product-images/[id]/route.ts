import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type RouteContext = { params: Promise<{ id: string }> };

function storagePathFromPublicUrl(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/product-images\/(.+)$/);
  return match?.[1] ?? null;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: imageId } = await context.params;
  const json = (body: object, status = 200) => NextResponse.json(body, { status });

  try {
    const env = getSupabasePublicEnv();
    if (!env.ok) return json({ ok: false, error: env.error }, 500);

    const response = NextResponse.next();
    const supabase = createClientFromRequest(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return json({ ok: false, error: "Sesión requerida.", needsLogin: true }, 401);
    }

    const { data: image } = await supabase
      .from("product_images")
      .select("id, url, user_id, product_id")
      .eq("id", imageId)
      .maybeSingle();

    if (!image) {
      return json({ ok: false, error: "Imagen no encontrada." }, 404);
    }

    if (image.user_id !== user.id) {
      return json({ ok: false, error: "Solo podés eliminar fotos que subiste vos." }, 403);
    }

    const storagePath = storagePathFromPublicUrl(image.url);
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from("product-images")
        .remove([storagePath]);

      if (storageError) {
        console.error("product-images storage delete:", storageError);
      }
    }

    const { error } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId)
      .eq("user_id", user.id);

    if (error) {
      return json({ ok: false, error: error.message }, 500);
    }

    const result = NextResponse.json({ ok: true });
    response.cookies.getAll().forEach((c) => result.cookies.set(c.name, c.value));
    return result;
  } catch (e) {
    return json(
      { ok: false, error: e instanceof Error ? e.message : "Error inesperado" },
      500
    );
  }
}
