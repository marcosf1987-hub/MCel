export interface ReviewSummaryInput {
  general_description: string;
  taste: string | null;
  price: number;
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
        `Evaluación ${i + 1}: Descripción: ${r.general_description}. Sabor: ${r.taste ?? "no indicado"}. Precio: $${r.price}.`
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
              "Sos un asistente para la comunidad celíaca en Argentina. Resumí en 2-3 oraciones en español rioplatense las evaluaciones de un producto, enfocándote en descripción general, sabor y relación precio/calidad. Sé conciso y objetivo. No des consejo médico.",
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
  const avgPrice =
    reviews.reduce((s, r) => s + r.price, 0) / reviews.length;
  const tastes = reviews
    .map((r) => r.taste)
    .filter(Boolean)
    .slice(0, 3)
    .join("; ");
  return `Basado en ${reviews.length} evaluaciones de la comunidad: los usuarios destacan aspectos variados del producto. ${
    tastes ? `Sobre el sabor mencionan: ${tastes}. ` : ""
  }El precio promedio reportado es de $${avgPrice.toFixed(0)}.`;
}
