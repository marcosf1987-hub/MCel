import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { UserTier } from "@/types/database";
import { TIER_LABELS } from "@/types/database";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-primary)] text-white",
        secondary: "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]",
        outline: "border border-[var(--color-border)]",
        bronze: "bg-amber-700 text-white",
        silver: "bg-slate-400 text-white",
        gold: "bg-yellow-500 text-amber-950",
        none: "bg-gray-200 text-gray-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function TierBadge({ tier, className }: { tier: UserTier; className?: string }) {
  const variant = tier === "none" ? "none" : tier;
  return (
    <span className={cn(badgeVariants({ variant: variant as VariantProps<typeof badgeVariants>["variant"] }), className)}>
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
