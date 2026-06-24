"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EnrichedNotification } from "@/lib/list-notifications";
import { Loader2 } from "lucide-react";

const TYPE_LABELS = {
  list_vote: "votó tu lista",
  list_comment: "comentó en tu lista",
} as const;

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function NotificationsList({
  initialNotifications,
}: {
  initialNotifications: EnrichedNotification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);

  const markRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      credentials: "include",
    });
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
  }, []);

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
      });
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => (n.read_at ? n : { ...n, read_at: now }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read_at);
    if (!unread.length) return;
    const timer = window.setTimeout(() => {
      void Promise.all(unread.slice(0, 5).map((n) => markRead(n.id)));
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [notifications, markRead]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (!notifications.length) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        No tenés notificaciones todavía.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => void markAllRead()}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Marcar todas como leídas
        </Button>
      )}

      <ul className="space-y-2">
        {notifications.map((n) => {
          const href =
            n.owner_username && n.list_slug
              ? `/listas/${n.owner_username}/${n.list_slug}`
              : null;
          const actor = n.actor_name ?? n.actor_username ?? "Alguien";

          return (
            <li key={n.id}>
              <Card className={!n.read_at ? "border-[var(--color-primary)]/40 bg-white" : undefined}>
                <CardContent className="py-3 text-sm">
                  <p className="text-[var(--color-brown)]">
                    <span className="font-medium">{actor}</span>{" "}
                    {TYPE_LABELS[n.type]}{" "}
                    {href ? (
                      <Link
                        href={href}
                        className="font-medium text-[var(--color-primary)] hover:underline"
                      >
                        {n.list_title}
                      </Link>
                    ) : (
                      <span className="font-medium">{n.list_title}</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    {formatWhen(n.created_at)}
                  </p>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
