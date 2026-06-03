"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  productId,
  initialFavorited = false,
  isLoggedIn = false,
  className,
  size = "md",
}: {
  productId: string;
  initialFavorited?: boolean;
  isLoggedIn?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const iconSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const pad = size === "sm" ? "p-1.5" : "p-2";

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      window.alert("Iniciá sesión para guardar en Favoritos");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/lists/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        favorited?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo actualizar favoritos");
      }

      setFavorited(Boolean(data.favorited));
      router.refresh();
    } catch (err) {
      console.error("Favorite toggle:", err);
      window.alert(
        err instanceof Error ? err.message : "No se pudo actualizar favoritos"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        isLoggedIn
          ? favorited
            ? "Quitar de favoritos"
            : "Agregar a favoritos"
          : "Iniciá sesión para guardar en Favoritos"
      }
      aria-pressed={favorited}
      aria-disabled={!isLoggedIn}
      className={cn(
        "rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-colors",
        pad,
        !isLoggedIn && "cursor-not-allowed opacity-50",
        isLoggedIn && favorited && "text-red-500",
        isLoggedIn && !favorited && "text-[var(--color-muted-foreground)] hover:text-red-400",
        loading && "opacity-70",
        className
      )}
    >
      <Heart
        className={cn(iconSize, favorited && isLoggedIn && "fill-current")}
      />
    </button>
  );
}
