"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function whatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function ShareWhatsAppButton({
  productName,
  productUrl,
  rating,
}: {
  productName: string;
  productUrl: string;
  rating?: number | null;
}) {
  const handleShare = () => {
    const ratingLine =
      rating != null && rating > 0 ? `⭐ ${Number(rating).toFixed(1)}/5 · ` : "";
    const text = `${ratingLine}${productName}\nMirá la ficha en MCel: ${productUrl}`;
    window.open(whatsAppShareUrl(text), "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleShare}
      aria-label="Compartir por WhatsApp"
    >
      <Share2 className="h-4 w-4" aria-hidden />
      WhatsApp
    </Button>
  );
}
