import { GuestScanBanner } from "@/components/home/guest-scan-banner";
import { MobileGuestHero } from "@/components/home/mobile/mobile-guest-hero";
import { GuestProductCarousel } from "@/components/home/mobile/guest-product-carousel";
import { GuestWeekRankings } from "@/components/home/mobile/guest-week-rankings";
import type { HomePageData } from "@/lib/home-server";

export function MobileGuestHome({ data }: { data: HomePageData }) {
  return (
    <div className="bg-[var(--color-brand-cream)] md:hidden">
      <MobileGuestHero
        avatarProfiles={data.avatarProfiles}
        collaboratorCount={data.collaboratorCount}
      />
      <GuestScanBanner />
      <GuestProductCarousel
        products={data.topRated}
        title="Mejor puntuados"
        subtitle="Puntuación ponderada por reputación"
      />
      <GuestWeekRankings products={data.topRated.slice(0, 3)} />
      <GuestProductCarousel
        products={data.mostReviewed}
        title="Más evaluados"
        subtitle="Los alimentos con más valoraciones"
        compact
      />
    </div>
  );
}
