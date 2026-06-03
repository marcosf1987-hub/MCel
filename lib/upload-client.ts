import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import { insertCommunityProductImage } from "@/lib/product-images";

/** Sube foto directo a Supabase (evita límite 4.5MB de Vercel). */
export async function uploadProductImageFromBrowser(
  productId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesión expirada. Volvé a iniciar sesión." };
  }

  try {
    const compressed = await compressImage(file);
    const ext = "jpg";
    const path = `${user.id}/${productId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, compressed, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      return {
        error: `No se pudo subir la foto: ${uploadError.message}. Verificá el bucket product-images en Supabase → Storage.`,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(path);

    try {
      await insertCommunityProductImage(supabase, productId, user.id, publicUrl);
    } catch (dbError) {
      const msg =
        dbError instanceof Error ? dbError.message : "Error al guardar la imagen";
      return {
        error: `Foto subida pero error al guardar: ${msg}. Si persiste, ejecutá la migración 006 en Supabase.`,
      };
    }

    return { url: publicUrl };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error al subir la imagen",
    };
  }
}
