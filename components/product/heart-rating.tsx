import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TasteRating } from "@/types/database";
import { TASTE_RATING_LABELS } from "@/types/database";

export function HeartRating({
  value,
  size = "md",
}: {
  value: TasteRating | null;
  size?: "sm" | "md";
}) {
  const rating = value ? Number(value) : 0;
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex" aria-label={value ? TASTE_RATING_LABELS[value] : "Sin sabor"}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Heart
          key={i}
          className={cn(
            sizeClass,
            i + 1 <= rating
              ? "fill-[var(--color-primary)] text-[var(--color-primary)]"
              : "text-gray-300"
          )}
        />
      ))}
    </div>
  );
}

export function HeartInput({
  value,
  onChange,
}: {
  value: TasteRating | "";
  onChange: (v: TasteRating) => void;
}) {
  const options: TasteRating[] = ["1", "2", "3", "4"];

  return (
    <div className="space-y-3">
      <div className="grid w-full grid-cols-4 gap-1">
        {options.map((n) => {
          const num = Number(n);
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-2 transition-colors sm:gap-1 sm:px-2",
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-brand-cream)]"
                  : "border-transparent hover:bg-[var(--color-brand-cream)]/60"
              )}
              aria-label={TASTE_RATING_LABELS[n]}
            >
              <div className="flex -space-x-0.5 sm:-space-x-1">
                {Array.from({ length: num }).map((_, i) => (
                  <Heart
                    key={i}
                    className={cn(
                      "h-5 w-5 shrink-0 sm:h-6 sm:w-6",
                      active
                        ? "fill-[var(--color-primary)] text-[var(--color-primary)]"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
      {value && (
        <p className="text-center text-sm font-medium text-[var(--color-brown)]">
          {TASTE_RATING_LABELS[value]}
        </p>
      )}
      {!value && (
        <p className="text-center text-xs text-[var(--color-muted-foreground)]">
          Elegí de 1 a 4 corazones
        </p>
      )}
    </div>
  );
}
