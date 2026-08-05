"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Portada con fallback a «Sin foto» si la URL no carga. */
export function ProductCoverImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 50vw, 25vw",
  fill = true,
  width,
  height,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  if (!showImage) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center text-xs text-[var(--color-muted-foreground)]",
          className
        )}
      >
        Sin foto
      </div>
    );
  }

  return (
    <Image
      src={src!}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={cn("object-contain p-3", className)}
      sizes={sizes}
      unoptimized={src!.includes("openfoodfacts")}
      onError={() => setFailed(true)}
    />
  );
}
