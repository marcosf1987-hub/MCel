import { ScanCtaBanner } from "@/components/home/scan-cta-banner";
import { FeaturedProductCompact } from "@/components/home/mobile/featured-product-compact";
import { MobileReviewsCarousel } from "@/components/home/mobile/mobile-reviews-carousel";
import { HomeRankedListRows } from "@/components/home/mobile/home-ranked-rows";
import { MobileTopRatedCarousel } from "@/components/home/mobile/mobile-top-rated-carousel";
import type { HomePageData } from "@/lib/home-server";

export function MobileAuthedHome({ data }: { data: HomePageData }) {
  return (
    <div className="md:hidden">
      <div className="px-4 pb-6 pt-2">
        {data.featuredProduct && (
          <FeaturedProductCompact product={data.featuredProduct} />
        )}
        <MobileReviewsCarousel reviews={data.latestReviews} />
        <HomeRankedListRows lists={data.topLists} title="Listas destacadas" />
        <MobileTopRatedCarousel products={data.topRated} title="Mejor puntuados" />
        <ScanCtaBanner variant="authed" />
      </div>
    </div>
  );
}
