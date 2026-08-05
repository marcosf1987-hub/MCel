"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductCoverImage } from "@/components/product/product-cover-image";

export function ProductCarousel({ images }: { images: { url: string; id: string }[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
        Sin imágenes
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {images.map((img) => (
            <div key={img.id} className="min-w-0 flex-[0_0_100%]">
              <div className="relative aspect-square bg-white">
                <ProductCoverImage
                  src={img.url}
                  alt="Producto"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="p-4"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90"
            onClick={scrollPrev}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90"
            onClick={scrollNext}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="mt-2 flex justify-center gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === selectedIndex ? "bg-[var(--color-accent)]" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
