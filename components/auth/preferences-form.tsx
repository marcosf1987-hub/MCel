"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile, UserPreferences } from "@/types/database";

export function PreferencesForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [prefs, setPrefs] = useState<UserPreferences>(
    (profile.preferences as UserPreferences) ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        preferences: {
          ...prefs,
          profile_public: prefs.profile_public ?? true,
          email_notifications: prefs.email_notifications ?? false,
          locale: "es-AR",
        },
      })
      .eq("id", profile.id);

    setSaving(false);
    if (error) setMessage(error.message);
    else {
      setMessage("Guardado correctamente");
      router.refresh();
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <Label htmlFor="displayName">Nombre para mostrar</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={prefs.profile_public !== false}
          onChange={(e) =>
            setPrefs({ ...prefs, profile_public: e.target.checked })
          }
        />
        Perfil público
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={prefs.email_notifications ?? false}
          onChange={(e) =>
            setPrefs({ ...prefs, email_notifications: e.target.checked })
          }
        />
        Notificaciones por email
      </label>
      {message && (
        <p className="text-sm text-[var(--color-muted-foreground)]">{message}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          Guardar
        </Button>
        <Button type="button" variant="outline" onClick={handleSignOut}>
          Cerrar sesión
        </Button>
      </div>
    </form>
  );
}
