import { TierBadge } from "@/components/ui/badge";
import { getTierProgress } from "@/lib/tier-progress";
import type { UserTier } from "@/types/database";

export function TierProgressJourney({
  collaborationCount,
  tier,
}: {
  collaborationCount: number;
  tier: UserTier;
}) {
  const progress = getTierProgress(collaborationCount);

  return (
    <div className="rounded-2xl border border-[var(--color-brand-light)] bg-[var(--color-brand-cream)] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <TierBadge tier={tier} className="text-sm px-3 py-1" />
        <span className="text-sm font-medium text-[var(--color-brown)]">
          {progress.count} colaboración{progress.count !== 1 ? "es" : ""}
        </span>
      </div>

      {progress.isMaxTier ? (
        <p className="mt-4 text-sm font-medium text-[var(--color-accent)]">
          ¡Llegaste al nivel máximo! Gracias por tanto aporte a la comunidad.
        </p>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-2">
            <div className="flex flex-col items-center gap-1 min-w-[4rem]">
              <span
                className="flex h-4 w-4 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-accent)]/30"
                aria-hidden
              />
              <span className="text-xs font-semibold text-[var(--color-brown)]">
                {progress.count}
              </span>
              <span className="text-[10px] text-[var(--color-muted-foreground)] text-center">
                {progress.currentLabel}
              </span>
            </div>

            <div className="relative flex-1 h-2 rounded-full bg-white/80 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-accent)] transition-all"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>

            <div className="flex flex-col items-center gap-1 min-w-[4rem]">
              <span
                className="flex h-4 w-4 rounded-full border-2 border-[var(--color-accent)] bg-white"
                aria-hidden
              />
              <span className="text-xs font-semibold text-[var(--color-brown)]">
                {progress.nextThreshold}
              </span>
              <span className="text-[10px] text-[var(--color-muted-foreground)] text-center">
                {progress.nextLabel}
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm text-[var(--color-brown)]">
            Estás a sólo{" "}
            <strong className="text-[var(--color-accent)]">{progress.remaining}</strong>{" "}
            colaboración{progress.remaining !== 1 ? "es" : ""} de pasar al siguiente
            nivel, ¡seguí colaborando!
          </p>
        </>
      )}
    </div>
  );
}
