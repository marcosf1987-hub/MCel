import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import { MegaMenu } from "@/components/layout/mega-menu";
import { Wheat } from "lucide-react";

export async function Header() {
  const env = getSupabasePublicEnv();
  let user = null;
  let profile: { display_name: string | null; tier: string } | null = null;

  if (env.ok) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user) {
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, tier")
        .eq("id", user.id)
        .single();
      profile = p;
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-brown)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-sm">
              <Wheat className="h-5 w-5" />
            </span>
            <span>Celíacos AR</span>
          </Link>
          <MegaMenu />
        </div>
        <div className="flex flex-1 items-center gap-3 sm:max-w-md sm:mx-4">
          <SearchBar />
        </div>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="accent" size="sm">
                <Link href="/productos/nuevo">+ Producto</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/cuenta/preferencias">
                  {profile?.display_name ?? "Mi cuenta"}
                </Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
