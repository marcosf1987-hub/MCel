"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminProductRow } from "@/lib/admin/catalog-server";
import type { Brand, Category, Subcategory } from "@/types/database";
import { Loader2 } from "lucide-react";

export function CatalogProductsManager({
  initialProducts,
}: {
  initialProducts: AdminProductRow[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<
    (Category & { subcategories: Subcategory[] })[]
  >([]);
  const [editForm, setEditForm] = useState({
    name: "",
    barcode: "",
    brand_id: "",
    category_id: "",
    subcategory_id: "",
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (includeDeleted) params.set("deleted", "true");
      const res = await fetch(`/api/admin/catalog/products?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudieron cargar los productos.");
        return;
      }
      setProducts(data.products as AdminProductRow[]);
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, [query, includeDeleted]);

  const loadTaxonomy = useCallback(async () => {
    const [brandsRes, catsRes] = await Promise.all([
      fetch("/api/admin/catalog/brands", { credentials: "include" }),
      fetch("/api/admin/catalog/categories", { credentials: "include" }),
    ]);
    const brandsData = await brandsRes.json();
    const catsData = await catsRes.json();
    if (brandsData.ok) setBrands(brandsData.brands);
    if (catsData.ok) setCategories(catsData.categories);
  }, []);

  useEffect(() => {
    void loadTaxonomy();
  }, [loadTaxonomy]);

  const startEdit = (product: AdminProductRow) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      barcode: product.barcode,
      brand_id: product.brand_id,
      category_id: product.category_id,
      subcategory_id: product.subcategory_id,
    });
  };

  const subcategoriesForCategory =
    categories.find((c) => c.id === editForm.category_id)?.subcategories ?? [];

  const patchProduct = async (
    productId: string,
    body: Record<string, unknown>
  ) => {
    setActingId(productId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/catalog/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo actualizar.");
        return false;
      }
      await loadProducts();
      return true;
    } catch {
      setError("Error de conexión.");
      return false;
    } finally {
      setActingId(null);
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const product = products.find((p) => p.id === editingId);
    const ok = await patchProduct(editingId, {
      ...editForm,
      brandName: brands.find((b) => b.id === editForm.brand_id)?.name ?? product?.brand_name,
    });
    if (ok) setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="product-search">Buscar</Label>
          <Input
            id="product-search"
            placeholder="Nombre o código de barras"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void loadProducts()}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
          />
          Incluir ocultos
        </label>
        <Button type="button" onClick={() => void loadProducts()} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Buscar
        </Button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {products.length === 0 && !loading ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No hay productos para mostrar.
        </p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <Card
              key={product.id}
              className={product.deleted_at ? "opacity-60" : undefined}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-base">{product.name}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {product.deleted_at ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={actingId === product.id}
                        onClick={() => void patchProduct(product.id, { restore: true })}
                      >
                        Restaurar
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(product)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={actingId === product.id}
                          onClick={() => void patchProduct(product.id, { hide: true })}
                        >
                          Ocultar
                        </Button>
                      </>
                    )}
                    {product.slug && !product.deleted_at && (
                      <Link
                        href={`/productos/${product.slug}`}
                        className="text-sm font-medium text-[var(--color-primary)] hover:underline self-center"
                        target="_blank"
                      >
                        Ver →
                      </Link>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-[var(--color-muted-foreground)]">
                <p>
                  {product.brand_name} · {product.category_name} /{" "}
                  {product.subcategory_name}
                </p>
                <p className="mt-1 font-mono text-xs">{product.barcode}</p>
                <p className="mt-1">
                  {product.review_count} evaluaciones
                  {product.weighted_rating != null &&
                    ` · ★ ${product.weighted_rating.toFixed(1)}`}
                  {product.deleted_at && (
                    <span className="ml-2 text-red-600">Oculto</span>
                  )}
                </p>

                {editingId === product.id && (
                  <div className="mt-4 space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-brand-cream)] p-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, name: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Código de barras</Label>
                      <Input
                        value={editForm.barcode}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, barcode: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Marca</Label>
                      <select
                        className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                        value={editForm.brand_id}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, brand_id: e.target.value }))
                        }
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Categoría</Label>
                        <select
                          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                          value={editForm.category_id}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              category_id: e.target.value,
                              subcategory_id: "",
                            }))
                          }
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name_es ?? c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Subcategoría</Label>
                        <select
                          className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                          value={editForm.subcategory_id}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              subcategory_id: e.target.value,
                            }))
                          }
                        >
                          {subcategoriesForCategory.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name_es ?? s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={actingId === product.id}
                        onClick={() => void saveEdit()}
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
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
