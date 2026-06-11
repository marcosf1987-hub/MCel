import { LatestReviewsSection } from "@/components/home/latest-reviews-section";
import { TopListsSection } from "@/components/home/top-lists-section";
import { TopRatedSection } from "@/components/home/top-rated-section";
import { ScanCtaBanner } from "@/components/home/scan-cta-banner";
import type { HomePageData } from "@/lib/home-server";

export function DesktopAuthedHome({ data }: { data: HomePageData }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <LatestReviewsSection reviews={data.latestReviews} />
      <TopListsSection lists={data.topLists} />
      <TopRatedSection products={data.topRated} />
      <ScanCtaBanner variant="authed" />
    </div>
  );
}
