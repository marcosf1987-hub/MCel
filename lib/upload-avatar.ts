import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";

export async function uploadAvatarFromBrowser(
  file: File
): Promise<{ url: string } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesión expirada. Volvé a iniciar sesión." };

  try {
    const compressed = await compressImage(file, 512, 0.85);
    const path = `${user.id}/avatar-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, compressed, { contentType: "image/jpeg", upsert: true });

    if (uploadError) {
      return {
        error: `No se pudo subir la foto: ${uploadError.message}. Ejecutá la migración 011 en Supabase si falta el bucket avatars.`,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (profileError) return { error: profileError.message };

    return { url: publicUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al subir avatar" };
  }
}
