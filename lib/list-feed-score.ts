export type FeedSort = "relevant" | "recent";

export function computeListRelevanceScore(list: {
  vote_count: number;
  downvote_count?: number;
  save_count?: number;
  updated_at: string;
}): number {
  const netVotes = list.vote_count - (list.downvote_count ?? 0) * 0.5;
  const saves = (list.save_count ?? 0) * 0.3;
  const hoursSinceUpdate =
    (Date.now() - new Date(list.updated_at).getTime()) / 3_600_000;
  const recency = (Math.max(0, 72 - hoursSinceUpdate) / 72) * 10;
  return netVotes * 2 + saves + recency;
}

export function sortFeedLists<T extends {
  vote_count: number;
  downvote_count?: number;
  save_count?: number;
  updated_at: string;
}>(lists: T[], sort: FeedSort): T[] {
  if (sort === "recent") {
    return [...lists].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }
  return [...lists].sort(
    (a, b) => computeListRelevanceScore(b) - computeListRelevanceScore(a)
  );
}
