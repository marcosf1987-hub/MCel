"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminCategoryRow } from "@/lib/admin/catalog-server";
import { Loader2 } from "lucide-react";

export function CatalogCategoriesManager({
  initialCategories,
}: {
  initialCategories: AdminCategoryRow[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [newCatName, setNewCatName] = useState("");
  const [newSubNames, setNewSubNames] = useState<Record<string, string>>({});
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const res = await fetch("/api/admin/catalog/categories", {
      credentials: "include",
    });
    const data = await res.json();
    if (data.ok) setCategories(data.categories);
  };

  const createCategory = async () => {
    if (!newCatName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/catalog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo crear.");
        return;
      }
      setNewCatName("");
      await reload();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const createSubcategory = async (categoryId: string) => {
    const name = (newSubNames[categoryId] ?? "").trim();
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/catalog/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ category_id: categoryId, name }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo crear.");
        return;
      }
      setNewSubNames((prev) => ({ ...prev, [categoryId]: "" }));
      await reload();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const saveCategory = async (id: string) => {
    if (!editName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/catalog/categories/${id}`, {
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
      setEditingCatId(null);
      setEditingSubId(null);
      await reload();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const saveSubcategory = async (id: string) => {
    if (!editName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/catalog/subcategories/${id}`, {
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
      setEditingSubId(null);
      await reload();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("¿Eliminar categoría y sus subcategorías?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/catalog/categories/${id}`, {
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

  const deleteSubcategory = async (id: string) => {
    if (!confirm("¿Eliminar subcategoría?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/catalog/subcategories/${id}`, {
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
          <CardTitle className="text-base">Nueva categoría</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="new-cat">Nombre</Label>
            <Input
              id="new-cat"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Ej: Snacks"
            />
          </div>
          <Button
            type="button"
            className="self-end"
            disabled={loading || !newCatName.trim()}
            onClick={() => void createCategory()}
          >
            Crear
          </Button>
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {categories.map((cat) => (
        <Card key={cat.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {editingCatId === cat.id ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="max-w-xs"
                />
              ) : (
                <CardTitle className="text-base">
                  {cat.name_es ?? cat.name}
                </CardTitle>
              )}
              <div className="flex gap-2">
                {editingCatId === cat.id ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      disabled={loading}
                      onClick={() => void saveCategory(cat.id)}
                    >
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingCatId(null)}
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
                        setEditingCatId(cat.id);
                        setEditName(cat.name);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={loading}
                      onClick={() => void deleteCategory(cat.id)}
                    >
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 pl-2">
              {cat.subcategories.map((sub) => (
                <li
                  key={sub.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  {editingSubId === sub.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="max-w-xs"
                    />
                  ) : (
                    <span>{sub.name_es ?? sub.name}</span>
                  )}
                  <div className="flex gap-1">
                    {editingSubId === sub.id ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          disabled={loading}
                          onClick={() => void saveSubcategory(sub.id)}
                        >
                          Guardar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSubId(null)}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSubId(sub.id);
                            setEditName(sub.name);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={loading}
                          onClick={() => void deleteSubcategory(sub.id)}
                        >
                          Eliminar
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
              <Input
                placeholder="Nueva subcategoría"
                value={newSubNames[cat.id] ?? ""}
                onChange={(e) =>
                  setNewSubNames((prev) => ({
                    ...prev,
                    [cat.id]: e.target.value,
                  }))
                }
                className="max-w-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loading || !(newSubNames[cat.id] ?? "").trim()}
                onClick={() => void createSubcategory(cat.id)}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agregar subcategoría
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
