"use client";

import { cn } from "@/lib/utils";

type WizardProgressProps = {
  step: number;
  total: number;
  title?: string;
};

export function WizardProgress({ step, total, title }: WizardProgressProps) {
  const pct = total > 0 ? Math.round((step / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--color-brown)]">
          Paso {step} de {total}
        </span>
        {title && (
          <span className="text-[var(--color-muted-foreground)]">{title}</span>
        )}
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className={cn("h-full rounded-full bg-[var(--color-primary)] transition-all")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
