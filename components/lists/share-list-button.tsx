"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function whatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function ShareListButton({
  listTitle,
  listUrl,
  voteCount,
}: {
  listTitle: string;
  listUrl: string;
  voteCount: number;
}) {
  const handleShare = () => {
    const votes =
      voteCount > 0 ? `${voteCount} ${voteCount === 1 ? "voto" : "votos"} · ` : "";
    const text = `${votes}Lista en MCel: ${listTitle}\n${listUrl}`;
    window.open(whatsAppShareUrl(text), "_blank", "noopener,noreferrer");
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleShare} className="gap-2">
      <Share2 className="h-4 w-4" />
      WhatsApp
    </Button>
  );
}
