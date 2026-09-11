import { LatestReviewsSection } from "@/components/home/latest-reviews-section";
import { TopListsSection } from "@/components/home/top-lists-section";
import { TopRatedSection } from "@/components/home/top-rated-section";
import { GuestScanBanner } from "@/components/home/guest-scan-banner";
import { MobileAuthedHome } from "@/components/home/mobile/mobile-authed-home";
import {
  AuthedHomeGreeting,
  AuthedQuickChips,
  type AuthedHomeProfile,
} from "@/components/home/mobile/authed-home-greeting";
import { VeredictoSemanaCard } from "@/components/home/mobile/veredicto-semana-card";
import { AuthedLatestPlaces } from "@/components/home/mobile/authed-lists-places";
import type { HomePageData } from "@/lib/home-server";

export function AuthedHome({
  data,
  profile,
}: {
  data: HomePageData;
  profile: AuthedHomeProfile;
}) {
  return (
    <>
      <MobileAuthedHome data={data} profile={profile} />

      <div className="mx-auto hidden max-w-6xl px-4 py-8 md:block">
        <div className="mb-8 overflow-hidden rounded-3xl border border-[var(--color-brand-light)] bg-[var(--color-brand-cream)] py-4">
          <AuthedHomeGreeting profile={profile} />
          <AuthedQuickChips />
        </div>

        {data.featuredProduct && (
          <div className="mb-8 [&_section]:mb-0 [&_section]:px-0">
            <VeredictoSemanaCard product={data.featuredProduct} />
          </div>
        )}

        <TopRatedSection products={data.topRated} />
        <LatestReviewsSection reviews={data.latestReviews} />
        <TopListsSection lists={data.topLists} />
        <TopRatedSection
          products={data.mostReviewed}
          title="Más evaluados"
          description="Los productos con mayor feedback de la comunidad."
        />
        <div className="[&_section]:px-0">
          <AuthedLatestPlaces places={data.latestPlaces} />
        </div>
        <GuestScanBanner />
      </div>
    </>
  );
}
