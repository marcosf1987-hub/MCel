"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProduct } from "@/app/actions/products";
import type { OffProductData } from "@/lib/off/parse";

export function NewProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [offImageUrl, setOffImageUrl] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleScan = async (code: string) => {
    setLoading(true);
    setError(null);
    setBarcode(code);

    try {
      const res = await fetch(`/api/products/lookup?barcode=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (data.existsInDb) {
        router.push(`/productos/${data.product.slug}/evaluar`);
        return;
      }

      const off = data.off as OffProductData | undefined;
      if (off?.found) {
        setBrand(off.brand);
        setName(off.productName);
        setCategory(off.category);
        setSubcategory(off.subcategory);
        setOffImageUrl(off.imageUrl ?? "");
        setManualMode(false);
      } else {
        setManualMode(true);
        setError(
          "Producto no encontrado en Open Food Facts. Completá los datos manualmente."
        );
      }
    } catch {
      setManualMode(true);
      setError("Error al buscar el producto. Podés cargarlo manualmente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (imageFile) formData.set("image", imageFile);

    const result = await createProduct(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  const showForm = barcode && (manualMode || brand || name);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Escanear producto</CardTitle>
        </CardHeader>
        <CardContent>
          <BarcodeScanner onScan={handleScan} disabled={loading} />
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {manualMode ? "Cargar producto manualmente" : "Confirmar datos del producto"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="barcode" value={barcode} />
              <input type="hidden" name="offImageUrl" value={offImageUrl} />

              <div>
                <Label>Código de barras</Label>
                <Input value={barcode} readOnly />
              </div>
              <div>
                <Label htmlFor="brand">Marca *</Label>
                <Input id="brand" name="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="name">Producto *</Label>
                <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="category">Categoría *</Label>
                <Input id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="subcategory">Subcategoría *</Label>
                <Input id="subcategory" name="subcategory" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="image">Imagen del producto *</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  required={!offImageUrl}
                />
                {offImageUrl && (
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    Se usará la imagen de Open Food Facts si no subís otra.
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
              <Button type="submit" disabled={loading}>
                Crear producto y evaluar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
