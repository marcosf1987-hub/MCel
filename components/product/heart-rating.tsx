import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardScaleField, wizardScaleButtonClass } from "@/components/ui/wizard-scale-field";
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
  const numValue = value ? Number(value) : 0;

  return (
    <WizardScaleField
      selectedLabel={value ? TASTE_RATING_LABELS[value] : null}
      emptyHint="Elegí de 1 a 4 corazones"
    >
      {options.map((n) => {
        const num = Number(n);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={wizardScaleButtonClass}
            aria-label={TASTE_RATING_LABELS[n]}
          >
            <Heart
              className={cn(
                "h-9 w-9",
                num <= numValue
                  ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                  : "text-gray-300"
              )}
            />
          </button>
        );
      })}
    </WizardScaleField>
  );
}
