import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { UserTier } from "@/types/database";
import { TIER_LABELS } from "@/types/database";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-accent)] text-[var(--color-brown)]",
        secondary: "bg-[var(--color-brand-light)] text-[var(--color-brown)]",
        outline: "border-2 border-[var(--color-border)] text-[var(--color-neutral)]",
        bronze: "bg-amber-700 text-white",
        silver: "bg-[var(--color-neutral)] text-white",
        gold: "bg-[var(--color-accent)] text-[var(--color-brown)]",
        none: "bg-[var(--color-secondary)] text-[var(--color-neutral)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function TierBadge({ tier, className }: { tier: UserTier; className?: string }) {
  const variant = tier === "none" ? "none" : tier;
  return (
    <span
      className={cn(
        badgeVariants({
          variant: variant as VariantProps<typeof badgeVariants>["variant"],
        }),
        className
      )}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
