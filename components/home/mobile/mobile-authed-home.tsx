import {
  AuthedHomeGreeting,
  AuthedQuickChips,
  type AuthedHomeProfile,
} from "@/components/home/mobile/authed-home-greeting";
import { VeredictoSemanaCard } from "@/components/home/mobile/veredicto-semana-card";
import { GuestProductCarousel } from "@/components/home/mobile/guest-product-carousel";
import { AuthedReviewsFeed } from "@/components/home/mobile/authed-reviews-feed";
import {
  AuthedListsSection,
  AuthedLatestPlaces,
} from "@/components/home/mobile/authed-lists-places";
import { AuthedMostReviewedChips } from "@/components/home/mobile/authed-most-reviewed-chips";
import { AuthedTopPlacesCarousel } from "@/components/home/mobile/authed-top-places-carousel";
import type { HomePageData } from "@/lib/home-server";

export function MobileAuthedHome({
  data,
  profile,
}: {
  data: HomePageData;
  profile: AuthedHomeProfile;
}) {
  return (
    <div className="bg-[var(--color-brand-cream)] md:hidden">
      <AuthedHomeGreeting profile={profile} />
      <AuthedQuickChips />
      {data.featuredProduct && <VeredictoSemanaCard product={data.featuredProduct} />}
      <GuestProductCarousel
        products={data.topRated}
        title="Mejor puntuados"
        subtitle="Con al menos 3 evaluaciones"
      />
      <AuthedReviewsFeed reviews={data.latestReviews} />
      <AuthedListsSection lists={data.topLists} />
      <AuthedMostReviewedChips products={data.mostReviewed} />
      <AuthedTopPlacesCarousel places={data.topPlaces} />
      <AuthedLatestPlaces places={data.latestPlaces} />
    </div>
  );
}
