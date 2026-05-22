import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PreferencesForm } from "@/components/auth/preferences-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/ui/badge";

export const metadata = { title: "Preferencias" };

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?returnUrl=/cuenta/preferencias");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Mi cuenta</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <TierBadge tier={profile.tier} />
            <span className="text-[var(--color-muted-foreground)]">
              {profile.collaboration_count} colaboraciones
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <PreferencesForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
