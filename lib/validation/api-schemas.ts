import { z } from "zod";

export const uuidSchema = z.string().uuid("ID inválido.");

export const createProductSchema = z.object({
  barcode: z
    .string()
    .trim()
    .min(4, "Falta el código de barras.")
    .max(64, "Código de barras demasiado largo."),
  brand: z.string().trim().min(1, "Completá marca y nombre.").max(120),
  name: z.string().trim().min(1, "Completá marca y nombre.").max(200),
  category_id: uuidSchema,
  subcategory_id: uuidSchema,
  offImageUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().url("URL de imagen inválida.").max(2000).optional()
  ),
});

export const createReviewSchema = z.object({
  productId: uuidSchema,
  productSlug: z.string().trim().min(1).max(200),
  rating: z.coerce.number().int().min(1, "Seleccioná una puntuación del 1 al 5.").max(5),
  opinion: z
    .string()
    .trim()
    .min(1, "Escribí tu opinión sobre el producto.")
    .max(4000),
  tasteRating: z.enum(["1", "2", "3", "4"]).nullish(),
  priceRange: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.enum(["1", "2", "3", "4"]).nullable()
  ),
  glutenCertification: z
    .enum([
      "sin_tacc",
      "sin_gluten",
      "con_trazas",
      "no_certificado",
      "desconocido",
    ])
    .optional()
    .default("desconocido"),
  skipImage: z.boolean().optional(),
});

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  opinion: z.string().trim().min(1, "Escribí tu opinión.").max(4000),
  tasteRating: z.enum(["1", "2", "3", "4"]).nullish(),
  priceRange: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.enum(["1", "2", "3", "4"]).nullable()
  ),
  glutenCertification: z
    .enum([
      "sin_tacc",
      "sin_gluten",
      "con_trazas",
      "no_certificado",
      "desconocido",
    ])
    .optional()
    .default("desconocido"),
  productSlug: z.string().trim().max(200).optional(),
});

export const createReportSchema = z.object({
  target_type: z.enum([
    "product",
    "review",
    "list",
    "list_comment",
    "place",
    "place_review",
  ]),
  target_id: uuidSchema,
  reason: z.string().trim().min(1, "Datos incompletos").max(2000),
});

export const createCommentSchema = z.object({
  text: z.string().trim().min(1, "Escribí un comentario.").max(2000),
});

export const searchQuerySchema = z.string().trim().min(2).max(100);

export const proposePlaceSchema = z.object({
  name: z.string().trim().min(2, "Nombre requerido.").max(200),
  place_type: z.enum(["comercio", "restaurante"]),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  address: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  website: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().url("URL inválida.").max(500).nullable().optional()
  ),
  cover_image_url: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().url().max(2000).nullable().optional()
  ),
  celiac_level: z
    .enum(["opciones", "dedicado", "certificado", "desconocido"])
    .default("desconocido"),
  celiac_notes: z.string().trim().max(2000).optional().nullable(),
});

export const createPlaceReviewSchema = z.object({
  placeId: uuidSchema,
  rating: z.coerce.number().int().min(1, "Seleccioná una puntuación.").max(5),
  opinion: z.string().trim().min(1, "Escribí tu opinión.").max(4000),
});

export const updatePlaceReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Seleccioná una puntuación.").max(5),
  opinion: z.string().trim().min(1, "Escribí tu opinión.").max(4000),
});

export const createPlaceItemSchema = z.object({
  placeId: uuidSchema,
  name: z.string().trim().min(1, "Nombre del plato/producto requerido.").max(200),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const createPlaceItemReviewSchema = z.object({
  placeItemId: uuidSchema,
  rating: z.coerce.number().int().min(1).max(5),
  opinion: z.string().trim().max(2000).optional().nullable(),
});

export const updatePlaceItemReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  opinion: z.string().trim().max(2000).optional().nullable(),
});

export function zodErrorMessage(error: z.ZodError): string {
  return error.errors[0]?.message ?? "Datos inválidos.";
}
