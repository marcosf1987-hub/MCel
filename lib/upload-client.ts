import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";

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

    const { error: dbError } = await supabase.from("product_images").insert({
      product_id: productId,
      user_id: user.id,
      url: publicUrl,
      is_official: false,
      sort_order: 99,
    });

    if (dbError) {
      return { error: `Foto subida pero error al guardar: ${dbError.message}` };
    }

    return { url: publicUrl };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error al subir la imagen",
    };
  }
}
