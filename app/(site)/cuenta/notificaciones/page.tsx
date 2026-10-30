import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchAllNotifications } from "@/lib/notifications";
import { NotificationsList } from "@/components/lists/notifications-list";
import { Bell } from "lucide-react";

export const metadata = { title: "Notificaciones" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?returnUrl=/cuenta/notificaciones");

  let notifications: Awaited<ReturnType<typeof fetchAllNotifications>> = [];
  try {
    notifications = await fetchAllNotifications(supabase, user.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (
      msg.includes("list_notifications") ||
      msg.includes("user_notifications") ||
      msg.includes("schema cache")
    ) {
      return (
        <div className="mx-auto max-w-lg px-4 py-8 text-sm text-[var(--color-muted-foreground)]">
          <p>
            Ejecutá las migraciones{" "}
            <code className="text-xs">016_lists_phase4_social.sql</code> y{" "}
            <code className="text-xs">017_user_moderation_notifications.sql</code>{" "}
            en Supabase para activar notificaciones.
          </p>
          <Link
            href="/cuenta/listas"
            className="mt-4 inline-block font-medium text-[var(--color-primary)]"
          >
            ← Mis listas
          </Link>
        </div>
      );
    }
    throw e;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--color-brown)]">
        <Bell className="h-7 w-7 text-[var(--color-accent)]" />
        Notificaciones
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Actividad en tus listas y avisos de moderación de tu cuenta o contenido.
      </p>

      <div className="mt-6">
        <NotificationsList initialNotifications={notifications} />
      </div>
    </div>
  );
}
