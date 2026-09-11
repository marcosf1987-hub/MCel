import Link from "next/link";
import Image from "next/image";
import { Sparkles, Star } from "lucide-react";
import { GLUTEN_LABELS } from "@/types/database";
import type { HomeFeaturedProduct } from "@/lib/home-server";

function excerpt(text: string | null, max = 120): string {
  if (!text?.trim()) return "";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function publicAuthorName(
  displayName: string | null | undefined,
  username: string | null | undefined
): string | null {
  const name = displayName?.trim();
  if (name) return name;

  const handle = username?.trim().replace(/^@/, "");
  if (!handle) return null;
  // Usernames autogenerados tipo user_<uuid> no se muestran
  if (/^user[_-]/i.test(handle) || handle.length > 24) return null;
  return handle;
}

export function VeredictoSemanaCard({ product }: { product: HomeFeaturedProduct }) {
  const cert = product.gluten_certification
    ? GLUTEN_LABELS[product.gluten_certification]
    : null;
  const quote =
    product.featured_opinion?.trim() ||
    product.ai_summary?.trim() ||
    null;
  const author =
    publicAuthorName(product.featured_display_name, product.featured_username) ??
    "Colaborador";


  return (
    <section className="mb-9 px-4">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
        <h2 className="font-[family-name:var(--font-headline)] text-xl font-semibold text-[var(--color-brown)]">
          Veredicto de la Semana
        </h2>
      </div>

      <article className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-[var(--color-primary)] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          Destacado
        </span>

        <div className="flex min-h-24 gap-3 pr-20">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--color-brand-cream)]">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-contain p-1"
                sizes="96px"
                priority
                unoptimized={product.image_url.includes("openfoodfacts")}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-[var(--color-muted-foreground)]">
                —
              </div>
            )}
          </div>

          <div className="flex h-24 min-w-0 flex-1 flex-col justify-between overflow-hidden">
            <div className="min-w-0">
              {product.brand_name && (
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  {product.brand_name}
                </p>
              )}
              <h3 className="line-clamp-2 font-[family-name:var(--font-headline)] text-[15px] font-semibold leading-tight text-[var(--color-brown)]">
                {product.name}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-[var(--color-primary)] text-[var(--color-primary)]" />
              <span className="text-[13px] font-bold text-[var(--color-brown)]">
                {product.weighted_rating?.toFixed(1) ?? "—"}
              </span>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                ({product.review_count})
              </span>
            </div>
            {cert && (
              <span className="inline-flex w-fit items-center rounded-full bg-[#e8f5e9] px-2 py-0.5 text-[10px] font-bold text-[#2f7a3e]">
                {cert}
              </span>
            )}
          </div>
        </div>

        {quote && (
          <div className="mt-3 rounded-lg bg-[#fff0ed] p-3 text-[13px] leading-relaxed text-[var(--color-muted-foreground)]">
            <p className="italic text-[var(--color-brown)]">&ldquo;{excerpt(quote)}&rdquo;</p>
            {author && (
              <cite className="mt-1 block text-[11px] font-bold not-italic text-[var(--color-primary)]">
                — {author}
              </cite>
            )}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Link
            href={`/productos/${product.slug}/evaluar`}
            className="flex flex-1 items-center justify-center rounded-lg bg-[var(--color-primary)] px-3 py-2.5 text-xs font-bold text-white"
          >
            Valorar producto
          </Link>
          <Link
            href={`/productos/${product.slug}`}
            className="rounded-lg bg-[#F5F1EB] px-4 py-2.5 text-xs font-bold text-[var(--color-brown)]"
          >
            Ver ficha
          </Link>
        </div>
      </article>
    </section>
  );
}
