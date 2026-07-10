"use client";

import { WizardScaleField, wizardScaleButtonClass } from "@/components/ui/wizard-scale-field";
import { cn } from "@/lib/utils";
import { PRICE_RANGE_OPTIONS, type PriceRange } from "@/types/database";

function priceDescription(value: PriceRange): string {
  const label = PRICE_RANGE_OPTIONS.find((o) => o.value === value)?.label ?? "";
  return label.includes(" — ") ? label.split(" — ")[1] : label;
}

export function PriceRangeInput({
  value,
  onChange,
  disabled,
}: {
  value: PriceRange | "";
  onChange: (v: PriceRange) => void;
  disabled?: boolean;
}) {
  const options: PriceRange[] = ["1", "2", "3", "4"];

  return (
    <WizardScaleField
      selectedLabel={value ? priceDescription(value) : null}
      emptyHint="Opcional — elegí cuánto pagaste por el producto"
    >
      {options.map((n) => {
        const symbols = "$".repeat(Number(n));
        const optionLabel = PRICE_RANGE_OPTIONS.find((o) => o.value === n)?.label ?? symbols;
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={cn(wizardScaleButtonClass, "px-2 disabled:opacity-50")}
            aria-label={optionLabel}
          >
            <span
              className={cn(
                "block min-w-[2.25rem] text-center text-lg font-bold sm:text-xl",
                active ? "text-[var(--color-accent)]" : "text-gray-300"
              )}
            >
              {symbols}
            </span>
          </button>
        );
      })}
    </WizardScaleField>
  );
}
