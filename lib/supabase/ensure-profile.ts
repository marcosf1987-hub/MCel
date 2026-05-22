import { createAdminClient } from "@/lib/supabase/admin";

/** Crea el perfil si el trigger de Supabase no lo hizo (respaldo). */
export async function ensureProfile(
  userId: string,
  email?: string | null,
  metadata?: Record<string, unknown> | null
) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return;

  const displayName =
    (metadata?.full_name as string) ||
    (metadata?.name as string) ||
    email?.split("@")[0] ||
    "Usuario";

  const username = `user_${userId.replace(/-/g, "")}`;

  await admin.from("profiles").upsert(
    {
      id: userId,
      display_name: displayName,
      username,
    },
    { onConflict: "id" }
  );
}
