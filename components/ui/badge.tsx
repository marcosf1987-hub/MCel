import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { UserTier } from "@/types/database";
import { TIER_LABELS } from "@/types/database";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
        secondary: "bg-[var(--color-brand-light)] text-[var(--color-neutral)]",
        outline: "border-2 border-[var(--color-border)] text-[var(--color-neutral)]",
        destructive: "bg-[var(--color-destructive)] text-white",
        success: "bg-[var(--color-secondary-brand)] text-white",
        bronze: "bg-amber-700 text-white",
        silver: "bg-[var(--color-neutral)] text-white",
        gold: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
        none: "bg-[var(--color-secondary)] text-[var(--color-neutral)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function TierBadge({
  tier,
  className,
}: {
  tier: UserTier;
  className?: string;
}) {
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

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
