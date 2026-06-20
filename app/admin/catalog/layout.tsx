import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session-profile";

export default async function AdminCatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const auth = await requireRole(supabase, "admin");

  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      redirect("/login?returnUrl=/admin/catalog");
    }
    redirect("/admin?error=sin_permisos_catalogo");
  }

  return children;
}
