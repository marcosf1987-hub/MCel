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
  target_type: z.enum(["product", "review", "list", "list_comment"]),
  target_id: uuidSchema,
  reason: z.string().trim().min(1, "Datos incompletos").max(2000),
});

export const createCommentSchema = z.object({
  text: z.string().trim().min(1, "Escribí un comentario.").max(2000),
});

export const searchQuerySchema = z.string().trim().min(2).max(100);

export function zodErrorMessage(error: z.ZodError): string {
  return error.errors[0]?.message ?? "Datos inválidos.";
}
