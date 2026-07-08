"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { StarInput } from "@/components/product/star-rating";
import { HeartInput } from "@/components/product/heart-rating";
import { PriceRangeInput } from "@/components/product/price-range-input";
import { ProductImagePicker } from "@/components/product/product-image-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBanner, type StatusType } from "@/components/ui/status-banner";
import { WizardProgress } from "@/components/ui/wizard-progress";
import { WizardFooter } from "@/components/ui/wizard-footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GLUTEN_LABELS,
  type GlutenCertification,
  type PriceRange,
  type TasteRating,
} from "@/types/database";
import { uploadProductImageFromBrowser } from "@/lib/upload-client";
import { Send, Trash2, X } from "lucide-react";

type ReviewInitialValues = {
  rating: number;
  tasteRating: TasteRating | "";
  priceRange: PriceRange | "";
  opinion: string;
  glutenCertification: GlutenCertification;
};

type UserProductImage = {
  id: string;
  url: string;
};

const STEP_TITLES = ["Puntuación", "Sabor", "Precio", "Opinión", "Foto"] as const;

export function ReviewForm({
  productId,
  productSlug,
  hasExistingImages = false,
  mode = "create",
  reviewId,
  initialValues,
  userImages: initialUserImages = [],
}: {
  productId: string;
  productSlug: string;
  hasExistingImages?: boolean;
  mode?: "create" | "edit";
  reviewId?: string;
  initialValues?: ReviewInitialValues;
  userImages?: UserProductImage[];
}) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const needsImageStep = isEdit || !hasExistingImages;
  const totalSteps = needsImageStep ? 5 : 4;

  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(initialValues?.rating ?? 0);
  const [tasteRating, setTasteRating] = useState<TasteRating | "">(
    initialValues?.tasteRating ?? ""
  );
  const [statusType, setStatusType] = useState<StatusType>("idle");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [glutenCert, setGlutenCert] = useState<GlutenCertification>(
    initialValues?.glutenCertification ?? "desconocido"
  );
  const [imageName, setImageName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userImages, setUserImages] = useState<UserProductImage[]>(initialUserImages);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRange | "">(
    initialValues?.priceRange ?? ""
  );
  const [opinion, setOpinion] = useState(initialValues?.opinion ?? "");

  const stepTitle = useMemo(() => {
    if (step <= 4) return STEP_TITLES[step - 1];
    return STEP_TITLES[4];
  }, [step]);

  const setStatus = (type: StatusType, message: string) => {
    setStatusType(type);
    setStatusMsg(message);
  };

  const validateStep = (current: number): boolean => {
    if (current === 1 && rating < 1) {
      setStatus("error", "Seleccioná una puntuación de 1 a 5 estrellas.");
      return false;
    }
    if (current === 2 && !tasteRating) {
      setStatus("error", "Elegí cómo te pareció el sabor (1 a 4 corazones).");
      return false;
    }
    if (current === 3 && !["1", "2", "3", "4"].includes(priceRange)) {
      setStatus("error", "Seleccioná un rango de precio.");
      return false;
    }
    if (current === 4 && !opinion.trim()) {
      setStatus("error", "Escribí tu opinión sobre el producto.");
      return false;
    }
    if (current === 5 && !isEdit && !selectedFile && !hasExistingImages) {
      setStatus("error", "Subí una foto del producto o volvé atrás si ya la cargaste.");
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStatusType("idle");
    setStatusMsg(null);
    if (step === 4 && !needsImageStep) {
      void submitReview();
      return;
    }
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const goBack = () => {
    setStatusType("idle");
    setStatusMsg(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSelectImage = (file: File | null) => {
    setSelectedFile(file);
    setImageName(file?.name ?? null);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm("¿Eliminar esta foto? No se puede deshacer.")) return;
    setDeletingImageId(imageId);
    try {
      const res = await fetch(`/api/product-images/${imageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error", data.error ?? "No se pudo eliminar la foto");
        return;
      }
      setUserImages((prev) => prev.filter((img) => img.id !== imageId));
      setStatus("success", "Foto eliminada.");
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleDelete = async () => {
    if (!reviewId) return;
    if (
      !window.confirm("¿Eliminar tu evaluación? Esta acción no se puede deshacer.")
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error", data.error ?? "No se pudo eliminar");
        return;
      }
      setStatus("success", "Evaluación eliminada.");
      setTimeout(() => {
        router.push(`/productos/${productSlug}`);
        router.refresh();
      }, 800);
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    if (!priceRange) {
      setStatus("error", "Seleccioná un rango de precio.");
      setStep(3);
      return;
    }

    const file = selectedFile;
    if (!isEdit && !file && !hasExistingImages) {
      setStatus("error", "Subí una foto del producto.");
      setStep(5);
      return;
    }

    setLoading(true);

    try {
      if (file) {
        setStatus("loading", "Comprimiendo y subiendo foto…");
        const uploadResult = await uploadProductImageFromBrowser(productId, file);
        if ("error" in uploadResult) {
          setStatus("error", uploadResult.error);
          return;
        }
      }

      const payload = {
        productId,
        productSlug,
        rating,
        tasteRating,
        priceRange,
        opinion: opinion.trim(),
        glutenCertification: glutenCert,
        skipImage: isEdit || hasExistingImages || Boolean(file),
      };

      setStatus("loading", isEdit ? "Guardando cambios…" : "Guardando evaluación…");

      const url = isEdit && reviewId ? `/api/reviews/${reviewId}` : "/api/reviews";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: {
        ok?: boolean;
        error?: string;
        slug?: string;
        needsLogin?: boolean;
      };

      try {
        data = JSON.parse(text);
      } catch {
        const preview = text.slice(0, 120).replace(/\s+/g, " ");
        setStatus(
          "error",
          `Error del servidor (código ${res.status}). Detalle: ${preview}`
        );
        return;
      }

      if (!res.ok || !data.ok) {
        if (data.needsLogin) {
          setStatus("error", data.error ?? "Sesión expirada.");
          setTimeout(
            () =>
              router.push(
                `/login?returnUrl=/productos/${productSlug}/${isEdit ? "editar-evaluacion" : "evaluar"}`
              ),
            2000
          );
          return;
        }
        setStatus("error", data.error ?? `Error del servidor (${res.status})`);
        return;
      }

      setStatus(
        "success",
        isEdit
          ? "¡Cambios guardados! Abriendo la ficha…"
          : "¡Evaluación publicada correctamente! Abriendo la ficha…"
      );
      setTimeout(() => {
        router.push(`/productos/${data.slug ?? productSlug}`);
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error("Review submit:", err);
      setStatus(
        "error",
        err instanceof Error ? err.message : "No se pudo conectar. Revisá tu internet."
      );
    } finally {
      setLoading(false);
    }
  };

  const isLastStep = step === totalSteps;

  const primaryLabel = isLastStep ? (
    <span className="inline-flex items-center gap-2">
      <Send className="h-5 w-5" />
      {isEdit ? "Guardar cambios" : "Publicar evaluación"}
    </span>
  ) : (
    "Siguiente"
  );

  return (
    <div className="space-y-4">
      <WizardProgress step={step} total={totalSteps} title={stepTitle} />

      <StatusBanner type={statusType} message={statusMsg} />

      {step === 1 && (
        <div>
          <Label>Puntuación general (1-5) *</Label>
          <div className="mt-3">
            <StarInput value={rating} onChange={setRating} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <Label>¿Cómo te pareció el sabor? *</Label>
          <div className="mt-3">
            <HeartInput value={tasteRating} onChange={setTasteRating} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <Label>Rango de precio *</Label>
          <div className="mt-3">
            <PriceRangeInput
              value={priceRange}
              onChange={setPriceRange}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="opinion">Tu opinión *</Label>
            <Textarea
              id="opinion"
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder="Contá tu experiencia con el producto…"
              rows={4}
              disabled={loading}
            />
          </div>
          <div>
            <Label>Certificación gluten</Label>
            <Select
              value={glutenCert}
              onValueChange={(v) => setGlutenCert(v as GlutenCertification)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GLUTEN_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 5 && needsImageStep && (
        <div className="space-y-4">
          {isEdit && userImages.length > 0 && (
            <div>
              <Label>Tus fotos</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {userImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-brand-cream)]"
                  >
                    <Image
                      src={img.url}
                      alt="Tu foto del producto"
                      fill
                      className="object-cover"
                      sizes="120px"
                      unoptimized={img.url.includes("supabase")}
                    />
                    <button
                      type="button"
                      disabled={loading || deletingImageId === img.id}
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
                      aria-label="Eliminar foto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <ProductImagePicker
            label={isEdit ? "Agregar foto" : "Foto del producto"}
            required={!isEdit && !hasExistingImages}
            disabled={loading}
            imageName={imageName}
            hint={
              isEdit
                ? "Podés tomar una foto nueva o elegir una del carrete."
                : "Las fotos se comprimen automáticamente."
            }
            onSelect={handleSelectImage}
          />
        </div>
      )}

      {loading && (
        <StatusBanner type="loading" message="Enviando… No cierres esta pantalla." />
      )}

      <WizardFooter
        showBack={step > 1}
        onBack={goBack}
        onPrimary={() => {
          if (isLastStep) void submitReview();
          else goNext();
        }}
        primaryLabel={primaryLabel}
        loading={loading}
        loadingLabel={isEdit ? "Guardando…" : "Enviando…"}
        disabled={loading}
      >
        {isEdit && reviewId && (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 text-red-600 hover:text-red-700"
            disabled={loading}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar mi evaluación
          </Button>
        )}
      </WizardFooter>
    </div>
  );
}
