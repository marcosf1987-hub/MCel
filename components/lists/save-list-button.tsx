"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SaveListButton({
  listId,
  initialSaved,
  initialSaveCount,
  isLoggedIn,
  isOwner,
}: {
  listId: string;
  initialSaved: boolean;
  initialSaveCount: number;
  isLoggedIn: boolean;
  isOwner: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialSaveCount);
  const [loading, setLoading] = useState(false);

  if (isOwner) return null;

  const handleSave = async () => {
    if (!isLoggedIn) {
      window.alert("Iniciá sesión para guardar listas");
      return;
    }
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/lists/${listId}/save`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        saved?: boolean;
        saveCount?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Error al guardar");
      setSaved(Boolean(data.saved));
      setCount(data.saveCount ?? count);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={saved ? "accent" : "outline"}
      size="sm"
      className="gap-2"
      disabled={loading}
      onClick={() => void handleSave()}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
      {saved ? "Guardada" : "Guardar lista"}
      {count > 0 && (
        <span className="text-xs opacity-80">({count})</span>
      )}
    </Button>
  );
}
