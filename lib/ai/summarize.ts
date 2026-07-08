import { PRICE_RANGE_LABELS, TASTE_RATING_LABELS, type PriceRange, type TasteRating } from "@/types/database";

export interface ReviewSummaryInput {
  opinion: string;
  taste: string | null;
  taste_rating: TasteRating | null;
  price_range: PriceRange;
}

function tasteLabel(r: ReviewSummaryInput): string {
  if (r.taste_rating) return TASTE_RATING_LABELS[r.taste_rating];
  return r.taste ?? "no indicado";
}

export async function summarizeReviews(
  reviews: ReviewSummaryInput[]
): Promise<string> {
  if (reviews.length === 0) {
    return "Aún no hay evaluaciones suficientes para generar un resumen.";
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildFallbackSummary(reviews);
  }

  const payload = reviews
    .map(
      (r, i) =>
        `Evaluación ${i + 1}: Opinión: ${r.opinion}. Sabor: ${tasteLabel(r)}. Rango de precio: ${PRICE_RANGE_LABELS[r.price_range]}.`
    )
    .join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Sos un asistente para la comunidad celíaca en Argentina. Resumí en 2-3 oraciones en español rioplatense las evaluaciones de un producto, enfocándote en la opinión de los usuarios, sabor y percepción de precio ($ a $$$$). Sé conciso y objetivo. No des consejo médico.",
          },
          { role: "user", content: payload },
        ],
        max_tokens: 200,
        temperature: 0.5,
      }),
    });

    if (!res.ok) return buildFallbackSummary(reviews);
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text || buildFallbackSummary(reviews);
  } catch {
    return buildFallbackSummary(reviews);
  }
}

function buildFallbackSummary(reviews: ReviewSummaryInput[]): string {
  const rangeCounts: Record<string, number> = {};
  for (const r of reviews) {
    const label = PRICE_RANGE_LABELS[r.price_range];
    rangeCounts[label] = (rangeCounts[label] ?? 0) + 1;
  }
  const commonRange = Object.entries(rangeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const tastes = reviews
    .map(tasteLabel)
    .filter((t) => t !== "no indicado")
    .slice(0, 3)
    .join("; ");
  return `Basado en ${reviews.length} evaluaciones de la comunidad: los usuarios destacan aspectos variados del producto. ${
    tastes ? `Sobre el sabor mencionan: ${tastes}. ` : ""
  }${
    commonRange
      ? `El rango de precio más reportado es ${commonRange}.`
      : ""
  }`;
}
