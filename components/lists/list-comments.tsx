"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReportButton } from "@/components/product/report-button";

type CommentRow = {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
  username: string | null;
  displayName: string | null;
};

export function ListComments({
  listId,
  isLoggedIn,
  currentUserId,
  listOwnerId,
}: {
  listId: string;
  isLoggedIn: boolean;
  currentUserId: string | null;
  listOwnerId: string;
}) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/lists/${listId}/comments`);
    const data = (await res.json()) as { ok?: boolean; comments?: CommentRow[] };
    if (data.ok && data.comments) setComments(data.comments);
    setLoaded(true);
  }, [listId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!isLoggedIn) {
      window.alert("Iniciá sesión para comentar");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Error");
      setText("");
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo comentar");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (commentId: string) => {
    if (!window.confirm("¿Eliminar este comentario?")) return;
    const res = await fetch(`/api/lists/${listId}/comments/${commentId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      window.alert(data.error ?? "No se pudo eliminar");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <section className="mt-10 border-t border-[var(--color-border)] pt-8">
      <h2 className="text-lg font-semibold text-[var(--color-brown)]">Comentarios</h2>

      {isLoggedIn && (
        <div className="mt-4 space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="¿Qué te parece esta lista?"
            rows={3}
            maxLength={2000}
          />
          <Button
            type="button"
            variant="accent"
            size="sm"
            disabled={loading || !text.trim()}
            onClick={() => void submit()}
          >
            Publicar comentario
          </Button>
        </div>
      )}

      {!isLoggedIn && (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          <Link href="/login" className="font-medium text-[var(--color-primary)] hover:underline">
            Iniciá sesión
          </Link>{" "}
          para comentar.
        </p>
      )}

      <ul className="mt-6 space-y-4">
        {!loaded && (
          <li className="text-sm text-[var(--color-muted-foreground)]">Cargando…</li>
        )}
        {loaded && comments.length === 0 && (
          <li className="text-sm text-[var(--color-muted-foreground)]">
            Todavía no hay comentarios. Sé el primero.
          </li>
        )}
        {comments.map((c) => {
          const canDelete =
            currentUserId &&
            (currentUserId === c.userId || currentUserId === listOwnerId);
          const author = c.displayName ?? c.username ?? "Usuario";
          return (
            <li key={c.id} className="rounded-lg bg-[var(--color-brand-cream)] px-4 py-3 text-sm">
              <p className="font-medium text-[var(--color-brown)]">
                {c.username ? (
                  <Link href={`/perfil/${c.username}`} className="hover:underline">
                    {author}
                  </Link>
                ) : (
                  author
                )}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[var(--color-neutral)]">{c.body}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {isLoggedIn && currentUserId !== c.userId && (
                  <ReportButton targetType="list_comment" targetId={c.id} />
                )}
                {canDelete && currentUserId && (
                  <button
                    type="button"
                    className="text-xs text-[var(--color-muted-foreground)] hover:underline"
                    onClick={() => void remove(c.id)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
