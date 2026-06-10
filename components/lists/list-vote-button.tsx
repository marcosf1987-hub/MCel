"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ListVoteType } from "@/types/database";

export function ListVoteButton({
  listId,
  initialVoteCount,
  initialDownvoteCount,
  initialMyVote,
  isLoggedIn,
  isOwner,
}: {
  listId: string;
  initialVoteCount: number;
  initialDownvoteCount: number;
  initialMyVote: ListVoteType | null;
  isLoggedIn: boolean;
  isOwner: boolean;
}) {
  const [myVote, setMyVote] = useState<ListVoteType | null>(initialMyVote);
  const [upCount, setUpCount] = useState(initialVoteCount);
  const [downCount, setDownCount] = useState(initialDownvoteCount);
  const [loading, setLoading] = useState<ListVoteType | null>(null);

  const castVote = async (type: ListVoteType) => {
    if (!isLoggedIn) {
      window.alert("Iniciá sesión para votar listas");
      return;
    }
    if (isOwner || loading) return;

    setLoading(type);
    try {
      const res = await fetch(`/api/lists/${listId}/vote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        myVote?: ListVoteType | null;
        voteCount?: number;
        downvoteCount?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Error al votar");
      setMyVote(data.myVote ?? null);
      setUpCount(data.voteCount ?? upCount);
      setDownCount(data.downvoteCount ?? downCount);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo votar");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant={myVote === "up" ? "accent" : "outline"}
        size="sm"
        className="gap-1.5"
        disabled={isOwner || Boolean(loading)}
        onClick={() => void castVote("up")}
        title={isOwner ? "No podés votar tu propia lista" : "Voto positivo"}
      >
        <ThumbsUp className={cn("h-4 w-4", myVote === "up" && "fill-current")} />
        {upCount}
      </Button>
      <Button
        type="button"
        variant={myVote === "down" ? "default" : "outline"}
        size="sm"
        className="gap-1.5"
        disabled={isOwner || Boolean(loading)}
        onClick={() => void castVote("down")}
        title={isOwner ? "No podés votar tu propia lista" : "Voto negativo"}
      >
        <ThumbsDown className={cn("h-4 w-4", myVote === "down" && "fill-current")} />
        {downCount}
      </Button>
    </div>
  );
}
