import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HomeSectionHeader({
  title,
  href,
  linkLabel = "Ver todo",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="font-[family-name:var(--font-headline)] text-xl font-bold text-[var(--color-brown)]">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]"
        >
          {linkLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
