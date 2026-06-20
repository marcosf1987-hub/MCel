"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminBrandRow } from "@/lib/admin/catalog-server";
import { Loader2 } from "lucide-react";

export function CatalogBrandsManager({
  initialBrands,
}: {
  initialBrands: AdminBrandRow[];
}) {
  const [brands, setBrands] = useState(initialBrands);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const res = await fetch("/api/admin/catalog/brands", { credentials: "include" });
    const data = await res.json();
    if (data.ok) setBrands(data.brands);
  };

  const createBrand = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/catalog/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo crear.");
        return;
      }
      setNewName("");
      await reload();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const saveBrand = async (id: string) => {
    if (!editName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/catalog/brands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setEditingId(null);
      await reload();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const deleteBrand = async (id: string) => {
    if (!confirm("¿Eliminar esta marca?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/catalog/brands/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo eliminar.");
        return;
      }
      await reload();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nueva marca</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="new-brand">Nombre</Label>
            <Input
              id="new-brand"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Arcor"
            />
          </div>
          <Button
            type="button"
            className="self-end"
            disabled={loading || !newName.trim()}
            onClick={() => void createBrand()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear
          </Button>
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="space-y-2">
        {brands.map((brand) => (
          <Card key={brand.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              {editingId === brand.id ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="max-w-xs"
                />
              ) : (
                <div>
                  <p className="font-medium text-[var(--color-brown)]">{brand.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {brand.slug} · {brand.product_count} producto
                    {brand.product_count !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                {editingId === brand.id ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      disabled={loading}
                      onClick={() => void saveBrand(brand.id)}
                    >
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(brand.id);
                        setEditName(brand.name);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={loading || brand.product_count > 0}
                      onClick={() => void deleteBrand(brand.id)}
                    >
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
