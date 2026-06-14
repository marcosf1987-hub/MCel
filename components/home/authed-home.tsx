import { FeaturedProductHero } from "@/components/home/featured-product-hero";
import { LatestReviewsSection } from "@/components/home/latest-reviews-section";
import { TopListsSection } from "@/components/home/top-lists-section";
import { TopRatedSection } from "@/components/home/top-rated-section";
import { ScanCtaBanner } from "@/components/home/scan-cta-banner";
import { MobileAuthedHome } from "@/components/home/mobile/mobile-authed-home";
import type { HomePageData } from "@/lib/home-server";

export function AuthedHome({ data }: { data: HomePageData }) {
  return (
    <>
      <MobileAuthedHome data={data} />

      <div className="mx-auto hidden max-w-6xl px-4 py-8 md:block">
        {data.featuredProduct && (
          <FeaturedProductHero product={data.featuredProduct} />
        )}
        <LatestReviewsSection reviews={data.latestReviews} />
        <TopListsSection lists={data.topLists} />
        <TopRatedSection products={data.topRated} />
        <ScanCtaBanner variant="authed" />
      </div>
    </>
  );
}
