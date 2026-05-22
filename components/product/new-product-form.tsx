"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBanner, type StatusType } from "@/components/ui/status-banner";
import { createProduct } from "@/app/actions/products";
import type { OffProductData } from "@/lib/off/parse";

export function NewProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusType, setStatusType] = useState<StatusType>("idle");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [offImageUrl, setOffImageUrl] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const setStatus = (type: StatusType, message: string) => {
    setStatusType(type);
    setStatusMsg(message);
  };

  const handleScan = async (code: string) => {
    setLoading(true);
    setStatus("loading", `Buscando producto con código ${code}…`);

    try {
      const res = await fetch(`/api/products/lookup?barcode=${encodeURIComponent(code)}`);
      const text = await res.text();

      if (!text.startsWith("{")) {
        setStatus(
          "error",
          "Error de conexión con el servidor. Revisá tu sesión o probá de nuevo."
        );
        setBarcode(code);
        setManualMode(true);
        return;
      }

      const data = JSON.parse(text) as {
        existsInDb?: boolean;
        product?: { slug: string };
        off?: OffProductData;
        error?: string;
      };

      setBarcode(code);

      if (data.error) {
        setStatus("error", data.error);
        setManualMode(true);
        return;
      }

      if (data.existsInDb && data.product) {
        setStatus("success", "Este producto ya existe. Te llevamos a evaluarlo…");
        setTimeout(() => {
          router.push(`/productos/${data.product!.slug}/evaluar`);
        }, 800);
        return;
      }

      const off = data.off;
      if (off?.found) {
        setBrand(off.brand || "");
        setName(off.productName || "");
        setCategory(off.category || "Sin categoría");
        setSubcategory(off.subcategory || "General");
        setOffImageUrl(off.imageUrl ?? "");
        setManualMode(false);
        setStatus(
          "success",
          "Producto encontrado en Open Food Facts. Revisá los datos y tocá «Crear producto y evaluar»."
        );
      } else {
        setManualMode(true);
        setStatus(
          "info",
          "No está en Open Food Facts. Completá los datos manualmente y subí una foto."
        );
      }
    } catch {
      setBarcode(code);
      setManualMode(true);
      setStatus("error", "No se pudo buscar el código. Podés cargar el producto manualmente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus("loading", "Guardando producto…");

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("barcode", barcode);
      formData.set("brand", brand);
      formData.set("name", name);
      formData.set("category", category);
      formData.set("subcategory", subcategory);
      formData.set("offImageUrl", offImageUrl);
      if (imageFile) formData.set("image", imageFile);

      const result = await createProduct(formData);

      if (!result.ok) {
        if (result.needsLogin) {
          setStatus("error", result.error);
          setTimeout(() => router.push("/login?returnUrl=/productos/nuevo"), 1500);
          return;
        }
        setStatus("error", result.error);
        return;
      }

      const slug = result.data!.slug;
      setStatus("success", "¡Producto creado! Abriendo formulario de evaluación…");
      setTimeout(() => {
        router.push(`/productos/${slug}/evaluar`);
        router.refresh();
      }, 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setStatus("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const showForm = Boolean(barcode);

  return (
    <div className="space-y-4">
      <StatusBanner type={statusType} message={statusMsg} />

      <Card>
        <CardHeader>
          <CardTitle>1. Escanear o ingresar código</CardTitle>
        </CardHeader>
        <CardContent>
          <BarcodeScanner
            onScan={handleScan}
            disabled={loading}
            onStatus={(type, msg) => setStatus(type, msg)}
          />
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              2. {manualMode ? "Datos del producto (manual)" : "Confirmar y crear"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Código de barras</Label>
                <Input value={barcode} readOnly className="bg-[var(--color-brand-cream)]" />
              </div>
              <div>
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  name="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Producto *</Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría *</Label>
                <Input
                  id="category"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="subcategory">Subcategoría *</Label>
                <Input
                  id="subcategory"
                  name="subcategory"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="image">Imagen del producto {!offImageUrl && "*"}</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setImageFile(f);
                    if (f) {
                      setStatus("info", `Foto seleccionada: ${f.name}`);
                    }
                  }}
                />
                {offImageUrl ? (
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    Hay imagen de Open Food Facts. Podés omitir la foto o subir una propia.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    Obligatoria si no hay imagen automática.
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? "Guardando…" : "Crear producto y evaluar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
