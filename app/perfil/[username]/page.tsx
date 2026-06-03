import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserPublicLists } from "@/lib/lists-server";
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

  const publicLists = await getUserPublicLists(supabase, profile.id);

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

      {profile.username && publicLists.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Listas públicas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {publicLists.map((list) => (
                <li key={list.id}>
                  <Link
                    href={`/listas/${profile.username}/${list.slug}`}
                    className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-[var(--color-brand-cream)]"
                  >
                    <span className="font-medium text-[var(--color-brown)]">
                      {list.title}
                    </span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {list.vote_count} {list.vote_count === 1 ? "voto" : "votos"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
