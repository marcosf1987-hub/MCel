import { UserAvatar } from "@/components/ui/user-avatar";
import {
  displayCollaboratorCount,
  formatCollaboratorCount,
} from "@/lib/avatar";
import type { HomeAvatarProfile } from "@/lib/home-server";

export function CommunityAvatarsStrip({
  profiles,
  collaboratorCount,
}: {
  profiles: HomeAvatarProfile[];
  collaboratorCount: number;
}) {
  const displayCount = displayCollaboratorCount(collaboratorCount);
  const shown = profiles.slice(0, 5);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <div className="flex items-center pl-1">
        {shown.map((p, i) => (
          <span key={p.id} className={i > 0 ? "-ml-2.5" : ""} style={{ zIndex: shown.length - i }}>
            <UserAvatar
              userId={p.id}
              displayName={p.display_name}
              username={p.username}
              avatarUrl={p.avatar_url}
              size="md"
              blurred
            />
          </span>
        ))}
      </div>
      <p className="text-sm text-[var(--color-neutral)]">
        Unite a los más de{" "}
        <strong className="font-semibold text-[var(--color-brown)]">
          {formatCollaboratorCount(displayCount)}
        </strong>{" "}
        colaboradores activos
      </p>
    </div>
  );
}
