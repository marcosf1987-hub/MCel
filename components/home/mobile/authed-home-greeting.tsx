import Link from "next/link";
import { Heart, ListMusic, MapPin } from "lucide-react";
import { tierContributorLabel } from "@/lib/avatar";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { UserTier } from "@/types/database";
import { cn } from "@/lib/utils";

export type AuthedHomeProfile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  tier: UserTier;
  collaboration_count: number;
};

function firstName(profile: AuthedHomeProfile): string {
  const source =
    profile.display_name?.trim() ||
    profile.username?.trim()?.replace(/^@/, "") ||
    "ahí";
  return source.split(/\s+/)[0] ?? source;
}

export function AuthedHomeGreeting({ profile }: { profile: AuthedHomeProfile }) {
  const name = firstName(profile);
  const tierLabel = tierContributorLabel(profile.tier);
  const showTier = profile.tier !== "none";

  return (
    <section className="mb-1 px-4 pt-3">
      <div className="flex items-center gap-3">
        <UserAvatar
          userId={profile.id}
          displayName={profile.display_name}
          username={profile.username}
          avatarUrl={profile.avatar_url}
          size="md"
        />
        <div className="min-w-0">
          <h1 className="truncate font-[family-name:var(--font-headline)] text-xl font-semibold text-[var(--color-brown)]">
            ¡Hola, {name}!
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-[13px] text-[var(--color-muted-foreground)]">
              {profile.collaboration_count}{" "}
              {profile.collaboration_count === 1 ? "colaboración" : "colaboraciones"}
              {showTier ? " ·" : ""}
            </p>
            {showTier && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold",
                  profile.tier === "gold" && "bg-[#f5edd0] text-[#7a5c00]",
                  profile.tier === "silver" && "bg-[#ebebeb] text-[#505050]",
                  profile.tier === "bronze" && "bg-[#f3e6dc] text-[#8a5a3a]"
                )}
              >
                {tierLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AuthedQuickChips() {
  return (
    <div className="mb-2 flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link
        href="/cuenta/listas/mis-favoritos"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F5F1EB] px-3.5 py-2 text-xs font-bold text-[var(--color-brown)]"
      >
        <Heart className="h-4 w-4 fill-[var(--color-primary)] text-[var(--color-primary)]" />
        Favoritos
      </Link>
      <Link
        href="/cuenta/listas"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F5F1EB] px-3.5 py-2 text-xs font-bold text-[var(--color-brown)]"
      >
        <ListMusic className="h-4 w-4 text-[var(--color-brown)]" />
        Mis Listas
      </Link>
      <Link
        href="/locales"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F5F1EB] px-3.5 py-2 text-xs font-bold text-[var(--color-brown)]"
      >
        <MapPin className="h-4 w-4 text-[var(--color-secondary-brand)]" />
        Locales cercanos
      </Link>
    </div>
  );
}
