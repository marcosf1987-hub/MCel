import {
  displayCollaboratorCount,
  formatCollaboratorCount,
} from "@/lib/avatar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { GuestHomeSearch } from "@/components/home/mobile/guest-home-search";
import type { HomeAvatarProfile } from "@/lib/home-server";

export function MobileGuestHero({
  avatarProfiles,
  collaboratorCount,
}: {
  avatarProfiles: HomeAvatarProfile[];
  collaboratorCount: number;
}) {
  const displayCount = displayCollaboratorCount(collaboratorCount);
  const shown = avatarProfiles.slice(0, 4);

  return (
    <section className="px-4 pb-4 pt-4">
      <div className="mb-3 inline-flex items-center self-start rounded-full bg-[var(--color-brand-light)] px-3 py-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
          Comunidad Celíaca
        </span>
      </div>

      <h1 className="font-[family-name:var(--font-headline)] text-[26px] font-bold leading-8 tracking-tight text-[var(--color-brown)]">
        Productos sin gluten evaluados por celíacos
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
        Unite a nuestra comunidad. Compartí y valorá productos para que cada bocado sea seguro
        y delicioso.
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-brand-cream)] p-3 shadow-sm">
        <div className="flex shrink-0 items-center pl-0.5">
          {shown.map((p, i) => (
            <span
              key={p.id}
              className={i > 0 ? "-ml-2" : ""}
              style={{ zIndex: shown.length - i }}
            >
              <UserAvatar
                userId={p.id}
                displayName={p.display_name}
                username={p.username}
                avatarUrl={p.avatar_url}
                size="sm"
                blurred
              />
            </span>
          ))}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight text-[var(--color-brown)]">
            Más de{" "}
            <span className="text-[var(--color-primary)]">
              {formatCollaboratorCount(displayCount)}
            </span>{" "}
            colaboradores activos
          </p>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Validando alimentos cada día
          </p>
        </div>
      </div>

      <div className="mt-4 [&_input]:rounded-xl [&_input]:bg-[#F5F1EB] [&_input]:pr-12">
        <GuestHomeSearch />
      </div>
    </section>
  );
}
