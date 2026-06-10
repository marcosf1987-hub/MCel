"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Collab = {
  userId: string;
  username: string | null;
  displayName: string | null;
};

export function ListCollaboratorsEditor({
  listId,
  initialCollaborators,
}: {
  listId: string;
  initialCollaborators: Collab[];
}) {
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const invite = async () => {
    const value = username.trim();
    if (!value) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}/collaborators`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        collaborator?: Collab & { userId: string };
        error?: string;
      };
      if (!res.ok || !data.ok || !data.collaborator) {
        throw new Error(data.error ?? "Error al invitar");
      }
      const c = data.collaborator;
      setCollaborators((prev) => [
        ...prev,
        {
          userId: c.userId,
          username: c.username,
          displayName: c.displayName,
        },
      ]);
      setUsername("");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo invitar");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (userId: string) => {
    if (!window.confirm("¿Quitar colaborador?")) return;
    const res = await fetch(
      `/api/lists/${listId}/collaborators?userId=${encodeURIComponent(userId)}`,
      { method: "DELETE", credentials: "include" }
    );
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      window.alert(data.error ?? "No se pudo quitar");
      return;
    }
    setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Los colaboradores pueden agregar y quitar productos. Solo vos editás título y visibilidad.
      </p>
      <div className="flex gap-2">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="usuario (sin @)"
          disabled={loading}
        />
        <Button type="button" variant="accent" size="sm" disabled={loading} onClick={() => void invite()}>
          Invitar
        </Button>
      </div>
      {collaborators.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {collaborators.map((c) => (
            <li
              key={c.userId}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2"
            >
              <span>
                {c.displayName ?? c.username ?? "Usuario"}
                {c.username && (
                  <span className="text-[var(--color-muted-foreground)]"> @{c.username}</span>
                )}
              </span>
              <button
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={() => void remove(c.userId)}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--color-muted-foreground)]">Sin colaboradores todavía.</p>
      )}
    </div>
  );
}
