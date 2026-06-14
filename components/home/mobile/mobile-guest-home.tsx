import { ScanCtaBanner } from "@/components/home/scan-cta-banner";
import { MobileGuestHero } from "@/components/home/mobile/mobile-guest-hero";
import { MobileTopRatedCarousel } from "@/components/home/mobile/mobile-top-rated-carousel";
import { HomeRankedProductRows } from "@/components/home/mobile/home-ranked-rows";
import type { HomePageData } from "@/lib/home-server";

export function MobileGuestHome({ data }: { data: HomePageData }) {
  return (
    <div className="md:hidden">
      <MobileGuestHero
        product={data.topRated[0] ?? null}
        avatarProfiles={data.avatarProfiles}
        collaboratorCount={data.collaboratorCount}
      />
      <div className="px-4 pb-6">
        <MobileTopRatedCarousel products={data.topRated} title="Mejor puntuados" />
        <HomeRankedProductRows
          products={data.topRated}
          title="Mejores puntuados de la semana"
        />
        <ScanCtaBanner variant="guest" />
      </div>
    </div>
  );
}
