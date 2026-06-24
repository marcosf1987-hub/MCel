"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { FeedSort } from "@/lib/list-feed-score";

export function FeedSortToggle({ current }: { current: FeedSort }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setSort = (sort: FeedSort) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "relevant") params.delete("sort");
    else params.set("sort", sort);
    const q = params.toString();
    router.push(q ? `/cuenta/feed?${q}` : "/cuenta/feed");
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant={current === "relevant" ? "default" : "outline"}
        onClick={() => setSort("relevant")}
      >
        Relevantes
      </Button>
      <Button
        type="button"
        size="sm"
        variant={current === "recent" ? "default" : "outline"}
        onClick={() => setSort("recent")}
      >
        Recientes
      </Button>
    </div>
  );
}
