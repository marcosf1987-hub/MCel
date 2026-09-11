import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CommunityAvatarsStrip } from "@/components/home/community-avatars-strip";
import { TopRatedSection } from "@/components/home/top-rated-section";
import { GuestScanBanner } from "@/components/home/guest-scan-banner";
import { MobileGuestHome } from "@/components/home/mobile/mobile-guest-home";
import type { HomePageData } from "@/lib/home-server";

export function GuestHome({ data }: { data: HomePageData }) {
  return (
    <>
      <MobileGuestHome data={data} />

      <div className="mx-auto hidden max-w-6xl px-4 py-6 md:block md:py-8">
        <section className="mb-10 overflow-hidden rounded-3xl border border-[var(--color-brand-light)] bg-[var(--color-brand-cream)] px-8 py-10 text-center shadow-sm">
          <p className="mb-3 inline-flex rounded-full bg-[var(--color-brand-light)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
            Comunidad Celíaca
          </p>
          <h1 className="font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-brown)]">
            Productos sin gluten evaluados por celíacos
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-neutral)]">
            Unite a nuestra comunidad. Compartí y valorá productos para que cada bocado sea
            seguro y delicioso.
          </p>
          <CommunityAvatarsStrip
            profiles={data.avatarProfiles}
            collaboratorCount={data.collaboratorCount}
          />
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="accent">
              <Link href="/productos">Explorar productos</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Crear cuenta</Link>
            </Button>
          </div>
        </section>

        <div className="mb-10 max-w-xl md:px-0 [&_section]:px-0">
          <GuestScanBanner />
        </div>

        <TopRatedSection products={data.topRated} />
        <TopRatedSection
          products={data.mostReviewed}
          title="Más evaluados"
          description="Los productos con más evaluaciones de la comunidad."
        />
      </div>
    </>
  );
}
