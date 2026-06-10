import type { ProductImageQualityDetails } from "@/types/database";

export type HeuristicScoreResult = {
  overall_score: number;
  details: ProductImageQualityDetails;
};

const LAPLACIAN_KERNEL = {
  width: 3,
  height: 3,
  kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0],
};

async function loadImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Nitidez, fondo y encuadre sin LLM (para cola larga y pre-filtro del pool). */
export async function scoreImageHeuristic(url: string): Promise<HeuristicScoreResult> {
  const buffer = await loadImageBuffer(url);
  if (!buffer) {
    return {
      overall_score: 30,
      details: {
        scorer: "heuristic",
        issues: ["no_se_pudo_cargar"],
        confidence: 0.2,
      },
    };
  }

  const sharp = (await import("sharp")).default;
  const base = sharp(buffer).rotate().resize(320, 320, { fit: "inside", withoutEnlargement: true });

  const grey = await base.clone().greyscale().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = grey;

  const edgeBuf = await base
    .clone()
    .greyscale()
    .convolve(LAPLACIAN_KERNEL)
    .raw()
    .toBuffer();

  let edgeSum = 0;
  let edgeSq = 0;
  for (let i = 0; i < edgeBuf.length; i++) {
    const v = edgeBuf[i] ?? 0;
    edgeSum += v;
    edgeSq += v * v;
  }
  const edgeMean = edgeSum / edgeBuf.length;
  const edgeVar = edgeSq / edgeBuf.length - edgeMean * edgeMean;
  const sharpness = Math.min(100, Math.round(Math.sqrt(Math.max(0, edgeVar)) * 2.2));

  const w = info.width;
  const h = info.height;
  const region = (x0: number, y0: number, x1: number, y1: number) => {
    let sum = 0;
    let sq = 0;
    let n = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const v = data[y * w + x] ?? 0;
        sum += v;
        sq += v * v;
        n++;
      }
    }
    const mean = sum / n;
    const variance = sq / n - mean * mean;
    return { mean, variance };
  };

  const marginX = Math.floor(w * 0.15);
  const marginY = Math.floor(h * 0.15);
  const corners = [
    region(0, 0, marginX, marginY),
    region(w - marginX, 0, w, marginY),
    region(0, h - marginY, marginX, h),
    region(w - marginX, h - marginY, w, h),
  ];
  const center = region(
    Math.floor(w * 0.3),
    Math.floor(h * 0.3),
    Math.floor(w * 0.7),
    Math.floor(h * 0.7)
  );

  const cornerVar =
    corners.reduce((acc, c) => acc + c.variance, 0) / corners.length;
  const cleanBackground = Math.min(
    100,
    Math.round(55 + (cornerVar < 400 ? 25 : cornerVar < 900 ? 10 : -15))
  );

  const centerContrast = Math.abs(center.mean - corners[0].mean);
  const framing = Math.min(
    100,
    Math.round(40 + centerContrast * 0.35 + (center.variance > 500 ? 20 : 5))
  );

  const labelLegibility = Math.min(100, Math.round(sharpness * 0.45 + framing * 0.35 + 15));

  const overall = Math.round(
    sharpness * 0.35 + cleanBackground * 0.25 + framing * 0.25 + labelLegibility * 0.15
  );

  const issues: string[] = [];
  if (sharpness < 35) issues.push("posible_foto_movida");
  if (cleanBackground < 40) issues.push("fondo_ruidoso");
  if (framing < 40) issues.push("encuadre_debil");

  return {
    overall_score: Math.max(0, Math.min(100, overall)),
    details: {
      framing,
      sharpness,
      clean_background: cleanBackground,
      label_legibility: labelLegibility,
      is_packaged_product: true,
      issues,
      confidence: 0.55,
      scorer: "heuristic",
    },
  };
}
