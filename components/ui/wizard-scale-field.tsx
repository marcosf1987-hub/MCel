"use client";

type WizardScaleFieldProps = {
  selectedLabel?: string | null;
  emptyHint: string;
  children: React.ReactNode;
};

export function WizardScaleField({
  selectedLabel,
  emptyHint,
  children,
}: WizardScaleFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-1">{children}</div>
      {selectedLabel ? (
        <p className="text-center text-sm font-medium text-[var(--color-brown)]">
          {selectedLabel}
        </p>
      ) : (
        <p className="text-center text-xs text-[var(--color-muted-foreground)]">
          {emptyHint}
        </p>
      )}
    </div>
  );
}

export const wizardScaleButtonClass =
  "rounded-full p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]";
