import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  max = 5,
  size = "md",
  showValue = true,
}: {
  value: number | null;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}) {
  const rating = value ?? 0;
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";

  return (
    <div className="flex items-center gap-2">
      <div className="flex" aria-label={`${rating} de ${max} estrellas`}>
        {Array.from({ length: max }).map((_, i) => {
          const filled = i + 1 <= Math.round(rating);
          const partial = !filled && i < rating;
          return (
            <Star
              key={i}
              className={cn(
                sizeClass,
                filled || partial
                  ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                  : "text-gray-300"
              )}
            />
          );
        })}
      </div>
      {showValue && value !== null && (
        <span className="text-sm font-medium text-[var(--color-neutral)]">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="rounded-full p-1 transition-transform hover:scale-110"
          aria-label={`${n} estrellas`}
        >
          <Star
            className={cn(
              "h-9 w-9",
              n <= value
                ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
