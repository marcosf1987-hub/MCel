import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CommunityAvatarsStrip } from "@/components/home/community-avatars-strip";
import type { HomeAvatarProfile, HomeTopRatedProduct } from "@/lib/home-server";

export function MobileGuestHero({
  product,
  avatarProfiles,
  collaboratorCount,
}: {
  product: HomeTopRatedProduct | null;
  avatarProfiles: HomeAvatarProfile[];
  collaboratorCount: number;
}) {
  return (
    <section className="relative mb-8 min-h-[320px] overflow-hidden">
      {product?.image_url ? (
        <>
          <Image
            src={product.image_url}
            alt=""
            fill
            className="scale-110 object-cover blur-3xl brightness-90"
            sizes="100vw"
            priority
            unoptimized={product.image_url.includes("openfoodfacts")}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-[var(--color-brand-cream)]/30 via-[var(--color-brand-cream)]/85 to-[var(--color-brand-cream)]"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-b from-[var(--color-secondary)]/20 via-[var(--color-brand-cream)] to-[var(--color-brand-cream)]"
          aria-hidden
        />
      )}

      <div className="relative px-4 pb-8 pt-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">
          Comunidad celíaca
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-headline)] text-3xl font-bold leading-tight text-[var(--color-brown)]">
          Productos sin gluten evaluados por celíacos
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-neutral)]">
          Unite a nuestra comunidad. Compartí y valorá productos para que cada bocado sea
          seguro y delicioso.
        </p>
        <CommunityAvatarsStrip
          profiles={avatarProfiles}
          collaboratorCount={collaboratorCount}
        />
        <div className="mt-5 flex flex-col gap-2.5">
          <Button asChild size="lg" variant="accent" className="w-full">
            <Link href="/productos">Explorar productos</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full bg-white/80 backdrop-blur-sm">
            <Link href="/login">Crear cuenta</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
