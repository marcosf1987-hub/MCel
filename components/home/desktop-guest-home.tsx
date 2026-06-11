import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CommunityAvatarsStrip } from "@/components/home/community-avatars-strip";
import { LatestReviewsSection } from "@/components/home/latest-reviews-section";
import { TopRatedSection } from "@/components/home/top-rated-section";
import { ScanCtaBanner } from "@/components/home/scan-cta-banner";
import type { HomePageData } from "@/lib/home-server";

export function DesktopGuestHome({ data }: { data: HomePageData }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-14 overflow-hidden rounded-3xl border border-[var(--color-brand-light)] bg-gradient-to-br from-[var(--color-brand-cream)] via-white to-[var(--color-secondary)] px-8 py-14 text-center shadow-sm">
        <p className="mb-3 inline-block rounded-full bg-[var(--color-accent)] px-4 py-1 text-xs font-semibold text-[var(--color-accent-foreground)]">
          Comunidad celíaca Argentina
        </p>
        <h1 className="font-[family-name:var(--font-headline)] text-4xl font-bold text-[var(--color-brown)]">
          Productos sin gluten evaluados por celíacos
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-neutral)]">
          Unite a nuestra comunidad celíaca. Compartí información sobre los productos que
          conocés y valoralos en base a tu experiencia para garantizar que cada bocado que
          damos sea seguro y delicioso.
        </p>
        <CommunityAvatarsStrip
          profiles={data.avatarProfiles}
          collaboratorCount={data.collaboratorCount}
        />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="accent">
            <Link href="/productos">Explorar productos</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Crear cuenta</Link>
          </Button>
        </div>
      </section>

      <LatestReviewsSection reviews={data.latestReviews} />
      <TopRatedSection products={data.topRated} />
      <ScanCtaBanner isLoggedIn={false} />
    </div>
  );
}
