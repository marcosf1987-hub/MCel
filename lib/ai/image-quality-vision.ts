import type { ProductImageQualityDetails } from "@/types/database";

export type VisionScoreResult = {
  image_id: string;
  overall_score: number;
  details: ProductImageQualityDetails;
};

type VisionInput = { id: string; url: string };

const SYSTEM_PROMPT = `Sos un evaluador de fotos para un catálogo de productos sin gluten en Argentina.
Puntuá cada imagen del 0 al 100 según calidad ESTÉTICA para usar como portada:
- encuadre (producto centrado, sin cortes raros)
- nitidez percibida (no movida/borrosa)
- fondo limpio (no mesada desordenada)
- legibilidad del envase (marca/nombre legible)
- debe mostrar claramente el producto empaquetado

NO uses resolución, peso del archivo ni DPI.
Respondé SOLO JSON válido con esta forma:
{
  "images": [
    {
      "image_id": "uuid",
      "overall_score": 0-100,
      "framing": 0-100,
      "sharpness": 0-100,
      "clean_background": 0-100,
      "label_legibility": 0-100,
      "is_packaged_product": true,
      "issues": ["texto corto"],
      "confidence": 0-1
    }
  ]
}`;

async function fetchImagePart(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const sharp = (await import("sharp")).default;
  const jpeg = await sharp(buf)
    .rotate()
    .resize(768, 768, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  return {
    inlineData: {
      mimeType: "image/jpeg" as const,
      data: jpeg.toString("base64"),
    },
  };
}

export async function scoreImagesVision(
  images: VisionInput[]
): Promise<VisionScoreResult[] | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || images.length === 0) return null;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    {
      text: `Evaluá estas ${images.length} fotos del mismo producto. IDs: ${images
        .map((i) => i.image_id)
        .join(", ")}`,
    },
  ];

  for (const img of images) {
    const part = await fetchImagePart(img.url);
    if (part) {
      parts.push({ text: `image_id: ${img.id}` });
      parts.push(part);
    }
  }

  if (parts.length < 2) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!res.ok) return null;

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;

    const parsed = JSON.parse(text) as {
      images?: {
        image_id: string;
        overall_score: number;
        framing?: number;
        sharpness?: number;
        clean_background?: number;
        label_legibility?: number;
        is_packaged_product?: boolean;
        issues?: string[];
        confidence?: number;
      }[];
    };

    const byId = new Map(images.map((i) => [i.id, i]));
    const results: VisionScoreResult[] = [];

    for (const row of parsed.images ?? []) {
      if (!byId.has(row.image_id)) continue;
      const overall = Math.max(0, Math.min(100, Math.round(row.overall_score)));
      results.push({
        image_id: row.image_id,
        overall_score: overall,
        details: {
          framing: row.framing,
          sharpness: row.sharpness,
          clean_background: row.clean_background,
          label_legibility: row.label_legibility,
          is_packaged_product: row.is_packaged_product ?? true,
          issues: row.issues ?? [],
          confidence: row.confidence ?? 0.8,
          scorer: "vision",
        },
      });
    }

    return results.length ? results : null;
  } catch {
    return null;
  }
}
