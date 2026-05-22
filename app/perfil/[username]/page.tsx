import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TierBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, collaboration_count, tier, preferences")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const prefs = profile.preferences as { profile_public?: boolean };
  if (prefs.profile_public === false) notFound();

  const { count } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{profile.display_name ?? profile.username}</CardTitle>
          <div className="flex items-center gap-2">
            <TierBadge tier={profile.tier} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>{profile.collaboration_count}</strong> colaboraciones en la comunidad
          </p>
          <p>
            <strong>{count ?? 0}</strong> evaluaciones publicadas
          </p>
          <p className="text-[var(--color-muted-foreground)]">
            Bronce: 10+ · Plata: 50+ · Oro: 100+ colaboraciones
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
