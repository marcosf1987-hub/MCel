"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ListCollaboratorRole } from "@/types/database";

const ROLE_LABELS: Record<ListCollaboratorRole, string> = {
  editor: "Editor",
  viewer: "Solo lectura",
};

type Collab = {
  userId: string;
  username: string | null;
  displayName: string | null;
  role: ListCollaboratorRole;
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
  const [inviteRole, setInviteRole] = useState<ListCollaboratorRole>("editor");
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
        body: JSON.stringify({ username: value, role: inviteRole }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        collaborator?: Collab;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.collaborator) {
        throw new Error(data.error ?? "Error al invitar");
      }
      setCollaborators((prev) => [...prev, data.collaborator!]);
      setUsername("");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo invitar");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, role: ListCollaboratorRole) => {
    const res = await fetch(`/api/lists/${listId}/collaborators`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      window.alert(data.error ?? "No se pudo actualizar el rol");
      return;
    }
    setCollaborators((prev) =>
      prev.map((c) => (c.userId === userId ? { ...c, role } : c))
    );
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
        Editores pueden agregar o quitar productos. Lectores solo ven la lista privada.
      </p>
      <div className="flex flex-wrap gap-2">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="usuario (sin @)"
          disabled={loading}
          className="min-w-[140px] flex-1"
        />
        <select
          className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as ListCollaboratorRole)}
          disabled={loading}
        >
          <option value="editor">Editor</option>
          <option value="viewer">Solo lectura</option>
        </select>
        <Button type="button" variant="accent" size="sm" disabled={loading} onClick={() => void invite()}>
          Invitar
        </Button>
      </div>
      {collaborators.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {collaborators.map((c) => (
            <li
              key={c.userId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2"
            >
              <span>
                {c.displayName ?? c.username ?? "Usuario"}
                {c.username && (
                  <span className="text-[var(--color-muted-foreground)]"> @{c.username}</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1 text-xs"
                  value={c.role}
                  onChange={(e) =>
                    void updateRole(c.userId, e.target.value as ListCollaboratorRole)
                  }
                >
                  <option value="editor">{ROLE_LABELS.editor}</option>
                  <option value="viewer">{ROLE_LABELS.viewer}</option>
                </select>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => void remove(c.userId)}
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--color-muted-foreground)]">Sin colaboradores todavía.</p>
      )}
    </div>
  );
}
