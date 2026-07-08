"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaxonomyCategoryFields } from "@/components/ui/taxonomy-category-fields";
import { StatusBanner, type StatusType } from "@/components/ui/status-banner";
import { WizardProgress } from "@/components/ui/wizard-progress";
import { compressImage } from "@/lib/compress-image";
import { ProductImagePicker } from "@/components/product/product-image-picker";
import { uploadProductImageFromBrowser } from "@/lib/upload-client";
import {
  findOtrosSelection,
  type TaxonomyCategory,
  type TaxonomySelection,
} from "@/lib/catalog-taxonomy";
import {
  isOffCategoryUseful,
  mapOffToTaxonomy,
} from "@/lib/off/map-to-taxonomy";
import type { OffProductData } from "@/lib/off/parse";

const LOAD_STEPS = 3;

const STEP_TITLES: Record<1 | 2 | 3, string> = {
  1: "Código de barras",
  2: "Datos del producto",
  3: "Imagen del producto",
};

export function NewProductForm() {
  const router = useRouter();
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [statusType, setStatusType] = useState<StatusType>("idle");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [taxonomy, setTaxonomy] = useState<TaxonomyCategory[]>([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [classification, setClassification] = useState<TaxonomySelection | null>(
    null
  );
  const [offImageUrl, setOffImageUrl] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = useState<{
    slug: string;
    productId: string;
    hasOffImage: boolean;
  } | null>(null);

  const setStatus = (type: StatusType, message: string) => {
    setStatusType(type);
    setStatusMsg(message);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/catalog/taxonomy");
        const data = await res.json();
        if (!cancelled && data.ok) {
          setTaxonomy(data.categories as TaxonomyCategory[]);
        }
      } catch {
        if (!cancelled) {
          setStatus("error", "No se pudo cargar el catálogo de categorías.");
        }
      } finally {
        if (!cancelled) setTaxonomyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyOffClassification = (
    categories: TaxonomyCategory[],
    offCategory: string,
    offSubcategory: string
  ) => {
    if (!isOffCategoryUseful(offCategory, offSubcategory)) {
      const otros = findOtrosSelection(categories);
      if (otros) setClassification(otros);
      return;
    }
    const match = mapOffToTaxonomy(offCategory, offSubcategory, categories);
    setClassification({
      categoryId: match.categoryId,
      subcategoryId: match.subcategoryId,
    });
  };

  const goToEvaluate = (slug: string) => {
    router.push(`/productos/${slug}/evaluar`);
    router.refresh();
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
        setTimeout(() => goToEvaluate(data.product!.slug), 800);
        return;
      }

      const off = data.off;
      if (off?.found) {
        setBrand(off.brand || "");
        setName(off.productName || "");
        if (taxonomy.length) {
          applyOffClassification(taxonomy, off.category, off.subcategory);
        }
        setOffImageUrl(off.imageUrl ?? "");
        setManualMode(false);
        setStatus("success", "Producto encontrado. Confirmá los datos en el siguiente paso.");
      } else {
        setManualMode(true);
        const otros = findOtrosSelection(taxonomy);
        if (otros) setClassification(otros);
        setStatus(
          "info",
          "No está en Open Food Facts. Completá los datos en el siguiente paso."
        );
      }

      setWizardStep(2);
    } catch {
      setBarcode(code);
      setManualMode(true);
      setStatus("error", "No se pudo buscar el código. Podés cargar el producto manualmente.");
      setWizardStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classification?.categoryId || !classification?.subcategoryId) {
      setStatus("error", "Elegí categoría y subcategoría del listado.");
      return;
    }

    setLoading(true);
    setStatus("loading", "Creando producto…");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          barcode,
          brand,
          name,
          category_id: classification.categoryId,
          subcategory_id: classification.subcategoryId,
          offImageUrl: offImageUrl || undefined,
        }),
      });

      const text = await res.text();
      let data: {
        ok?: boolean;
        error?: string;
        slug?: string;
        productId?: string;
        alreadyExists?: boolean;
        needsLogin?: boolean;
      };

      try {
        data = JSON.parse(text);
      } catch {
        setStatus("error", `Error del servidor (código ${res.status}).`);
        return;
      }

      if (!res.ok || !data.ok) {
        if (data.needsLogin) {
          setStatus("error", data.error ?? "Sesión expirada.");
          setTimeout(() => router.push("/login?returnUrl=/productos/nuevo"), 1500);
          return;
        }
        setStatus("error", data.error ?? `Error (${res.status})`);
        return;
      }

      const slug = data.slug!;
      const productId = data.productId!;

      if (data.alreadyExists) {
        setStatus("success", "Este producto ya existe. Abriendo evaluación…");
        setTimeout(() => goToEvaluate(slug), 600);
        return;
      }

      const hasOffImage = Boolean(offImageUrl);
      setCreatedProduct({ slug, productId, hasOffImage });

      if (hasOffImage) {
        setStatus("success", "Producto creado con imagen de Open Food Facts.");
        setTimeout(() => goToEvaluate(slug), 600);
        return;
      }

      setStatus("success", "Producto creado. Podés subir una foto o saltear.");
      setWizardStep(3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setStatus("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleImageStep = async (skip: boolean) => {
    if (!createdProduct) return;

    if (skip) {
      goToEvaluate(createdProduct.slug);
      return;
    }

    if (!imageFile) {
      setStatus("error", "Elegí una foto o tocá Saltear.");
      return;
    }

    setLoading(true);
    setStatus("loading", "Comprimiendo y subiendo foto…");

    try {
      const compressed = await compressImage(imageFile);
      const uploadResult = await uploadProductImageFromBrowser(
        createdProduct.productId,
        compressed
      );
      if ("error" in uploadResult) {
        setStatus(
          "info",
          `${uploadResult.error} Podés subir la foto en la evaluación.`
        );
        setTimeout(() => goToEvaluate(createdProduct.slug), 2000);
        return;
      }

      setStatus("success", "¡Foto subida! Abriendo evaluación…");
      setTimeout(() => goToEvaluate(createdProduct.slug), 600);
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Error al subir la foto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <WizardProgress
        step={wizardStep}
        total={LOAD_STEPS}
        title={STEP_TITLES[wizardStep]}
      />

      <StatusBanner type={statusType} message={statusMsg} />

      {wizardStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Escanear o ingresar código</CardTitle>
          </CardHeader>
          <CardContent>
            <BarcodeScanner
              onScan={handleScan}
              disabled={loading || taxonomyLoading}
              onStatus={(type, msg) => setStatus(type, msg)}
            />
          </CardContent>
        </Card>
      )}

      {wizardStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {manualMode ? "Datos del producto (manual)" : "Confirmar y crear"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProduct} className="space-y-4">
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
              <TaxonomyCategoryFields
                categories={taxonomy}
                value={classification}
                onChange={setClassification}
                disabled={loading || taxonomyLoading}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => setWizardStep(1)}
                >
                  Atrás
                </Button>
                <Button
                  type="submit"
                  disabled={loading || taxonomyLoading}
                  className="flex-1"
                  size="lg"
                >
                  {loading ? "Creando…" : "Crear producto"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {wizardStep === 3 && createdProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Imagen del producto</CardTitle>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Subí una foto o saltear si preferís hacerlo en la evaluación.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProductImagePicker
              label="Foto del producto"
              disabled={loading}
              imageName={imageName}
              hint="Se comprime automáticamente antes de subir."
              onSelect={(file) => {
                setImageFile(file);
                setImageName(file?.name ?? null);
              }}
            />

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                disabled={loading || !imageFile}
                className="w-full"
                size="lg"
                onClick={() => handleImageStep(false)}
              >
                {loading ? "Subiendo…" : "Subir foto y evaluar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="w-full"
                onClick={() => handleImageStep(true)}
              >
                Saltear por ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
