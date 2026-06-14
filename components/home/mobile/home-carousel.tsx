"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function HomeCarousel({ children }: { children: React.ReactNode }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnapCount(emblaApi.scrollSnapList().length);
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div>
      <div className="-mx-4 overflow-hidden px-4" ref={emblaRef}>
        <div className="flex">{children}</div>
      </div>
      {snapCount > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: snapCount }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === selectedIndex
                  ? "w-4 bg-[var(--color-primary)]"
                  : "w-1.5 bg-[var(--color-border)]"
              )}
              aria-hidden
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HomeCarouselSlide({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 flex-[0_0_82%] pl-4 first:pl-0", className)}>{children}</div>
  );
}
