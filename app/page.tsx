import { createClient } from "@/lib/supabase/server";
import { getHomePageData } from "@/lib/home-server";
import { GuestHome } from "@/components/home/guest-home";
import { AuthedHome } from "@/components/home/authed-home";
import type { AuthedHomeProfile } from "@/components/home/mobile/authed-home-greeting";
import type { UserTier } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const homeData = await getHomePageData(supabase);

  if (!user) {
    return <GuestHome data={homeData} />;
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, tier, collaboration_count")
    .eq("id", user.id)
    .maybeSingle();

  const profile: AuthedHomeProfile = {
    id: user.id,
    display_name: profileRow?.display_name ?? null,
    username: profileRow?.username ?? null,
    avatar_url: profileRow?.avatar_url ?? null,
    tier: ((profileRow?.tier as UserTier | undefined) ?? "none") as UserTier,
    collaboration_count: profileRow?.collaboration_count ?? 0,
  };

  return <AuthedHome data={homeData} profile={profile} />;
}
