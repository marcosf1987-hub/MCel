"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBellLink({
  unreadCount,
}: {
  unreadCount: number;
}) {
  return (
    <Link
      href="/cuenta/notificaciones"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-brand-cream)] hover:text-[var(--color-brown)]"
      aria-label={
        unreadCount > 0
          ? `Notificaciones, ${unreadCount} sin leer`
          : "Notificaciones"
      }
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
