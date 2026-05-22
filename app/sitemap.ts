import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticUrls: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/productos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/marcas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return staticUrls;
  }

  try {
    const supabase = await createClient();
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .limit(500);

    const productUrls = (products ?? []).map((p) => ({
      url: `${base}/productos/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticUrls, ...productUrls];
  } catch {
    return staticUrls;
  }
}
