"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LIST_VISIBILITY_LABELS } from "@/lib/lists";
import type { ListVisibility } from "@/types/database";

export function ListForm({
  mode,
  listId,
  initial,
}: {
  mode: "create" | "edit";
  listId?: string;
  initial?: {
    title: string;
    description: string;
    visibility: ListVisibility;
    isSystem?: boolean;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [visibility, setVisibility] = useState<ListVisibility>(
    initial?.visibility ?? "private"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = mode === "create" ? "/api/lists" : `/api/lists/${listId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description, visibility }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        list?: { slug: string };
        error?: string;
      };

      if (!res.ok || !data.ok) throw new Error(data.error ?? "Error al guardar");

      if (mode === "create" && data.list?.slug) {
        router.push(`/cuenta/listas/${data.list.slug}/editar`);
        router.refresh();
        return;
      }

      router.refresh();
      setError(null);
      alert("Lista actualizada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="list-title">Título *</Label>
        <Input
          id="list-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={initial?.isSystem}
        />
      </div>
      <div>
        <Label htmlFor="list-desc">Descripción</Label>
        <Input
          id="list-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional"
        />
      </div>
      {!initial?.isSystem && (
        <div>
          <Label htmlFor="list-vis">Visibilidad</Label>
          <select
            id="list-vis"
            className="mt-1 flex h-11 w-full rounded-xl border-2 border-[var(--color-border)] bg-white px-4 text-sm"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ListVisibility)}
          >
            {(Object.keys(LIST_VISIBILITY_LABELS) as ListVisibility[]).map((v) => (
              <option key={v} value={v}>
                {LIST_VISIBILITY_LABELS[v]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Pública: aparece en Explorar. Con link: solo quien tenga la URL. Privada: solo vos.
          </p>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando…" : mode === "create" ? "Crear lista" : "Guardar cambios"}
      </Button>
    </form>
  );
}
