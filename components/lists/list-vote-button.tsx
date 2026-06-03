"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ListVoteButton({
  listId,
  initialVoteCount,
  initialVoted,
  isLoggedIn,
  isOwner,
}: {
  listId: string;
  initialVoteCount: number;
  initialVoted: boolean;
  isLoggedIn: boolean;
  isOwner: boolean;
}) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialVoteCount);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    if (!isLoggedIn) {
      window.alert("Iniciá sesión para votar listas");
      return;
    }
    if (isOwner) return;
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/lists/${listId}/vote`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        voted?: boolean;
        voteCount?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Error al votar");
      setVoted(Boolean(data.voted));
      setCount(data.voteCount ?? count);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo votar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={voted ? "accent" : "outline"}
      size="sm"
      className="gap-2"
      disabled={isOwner || loading}
      onClick={() => void handleVote()}
      title={isOwner ? "No podés votar tu propia lista" : undefined}
    >
      <ThumbsUp className={cn("h-4 w-4", voted && "fill-current")} />
      {count} {count === 1 ? "voto" : "votos"}
    </Button>
  );
}
