import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CommunityAvatarsStrip } from "@/components/home/community-avatars-strip";
import { LatestReviewsSection } from "@/components/home/latest-reviews-section";
import { TopRatedSection } from "@/components/home/top-rated-section";
import { ScanCtaBanner } from "@/components/home/scan-cta-banner";
import type { HomePageData } from "@/lib/home-server";

export function GuestHome({ data }: { data: HomePageData }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <section className="mb-10 overflow-hidden rounded-3xl border border-[var(--color-brand-light)] bg-gradient-to-br from-[var(--color-brand-cream)] via-white to-[var(--color-secondary)] px-6 py-8 text-center shadow-sm md:mb-14 md:px-8 md:py-10">
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)] md:text-3xl">
          Productos sin gluten evaluados por celíacos
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-neutral)] md:text-base">
          Unite a nuestra comunidad celíaca. Compartí información sobre los productos que
          conocés y valoralos en base a tu experiencia para garantizar que cada bocado que
          damos sea seguro y delicioso.
        </p>
        <CommunityAvatarsStrip
          profiles={data.avatarProfiles}
          collaboratorCount={data.collaboratorCount}
        />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Button asChild size="lg" variant="accent" className="w-full sm:w-auto">
            <Link href="/productos">Explorar productos</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/login">Crear cuenta</Link>
          </Button>
        </div>
      </section>

      <LatestReviewsSection reviews={data.latestReviews} />
      <TopRatedSection products={data.topRated} />
      <ScanCtaBanner variant="guest" />
    </div>
  );
}
