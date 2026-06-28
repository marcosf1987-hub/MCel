import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { getCategoriesNavData } from "@/lib/categories-cache";
import type { CategoriesNavData } from "@/lib/categories-types";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import { CategoryMegaMenu } from "@/components/layout/category-mega-menu";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { NotificationBellLink } from "@/components/lists/notification-bell-link";
import { countAllUnreadNotifications } from "@/lib/notifications";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import { AdminPanelLink } from "@/components/admin/admin-panel-link";
import type { AppRole } from "@/types/database";
import { Wheat, Heart, User, ListMusic } from "lucide-react";

type HeaderProfile = {
  display_name: string | null;
  tier: string;
  app_role: AppRole;
};

export async function Header() {
  const env = getSupabasePublicEnv();
  let user = null;
  let profile: HeaderProfile | null = null;
  let unreadNotifications = 0;
  let showAdminPanel = false;

  if (env.ok) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user) {
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, tier, app_role")
        .eq("id", user.id)
        .single();
      profile = p as HeaderProfile | null;
      showAdminPanel = p ? canAccessAdminPanel(p.app_role as AppRole) : false;
      try {
        unreadNotifications = await countAllUnreadNotifications(supabase, user.id);
      } catch {
        unreadNotifications = 0;
      }
    }
  }

  let categoriesData: CategoriesNavData = { categories: [], totalProducts: 0 };
  try {
    categoriesData = await getCategoriesNavData();
  } catch (e) {
    console.error("Header categories:", e);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-md shadow-sm">
        {/* Mobile */}
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 md:hidden">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 font-[family-name:var(--font-headline)] text-base font-bold text-[var(--color-brown)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-sm">
              <Wheat className="h-4 w-4" />
            </span>
            <span className="hidden min-[360px]:inline">CeliApp</span>
          </Link>

          <div className="min-w-0 flex-1">
            <SearchBar compact />
          </div>

          {!user && (
            <Button asChild size="sm" className="shrink-0 text-xs">
              <Link href="/login">Entrar</Link>
            </Button>
          )}
          {user && (
            <div className="flex shrink-0 items-center gap-1">
              {showAdminPanel && (
                <AdminPanelLink variant="ghost" size="icon" showLabel={false} />
              )}
              <NotificationBellLink unreadCount={unreadNotifications} />
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className="mx-auto hidden max-w-6xl items-center gap-4 px-4 py-3 md:flex">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-brown)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-sm">
              <Wheat className="h-5 w-5" />
            </span>
            <span>CeliApp</span>
          </Link>

          <CategoryMegaMenu data={categoriesData} />

          <div className="mx-2 max-w-md flex-1">
            <SearchBar />
          </div>

          <nav className="ml-auto flex shrink-0 items-center gap-1">
            {user ? (
              <>
                <NotificationBellLink unreadCount={unreadNotifications} />
                {showAdminPanel && <AdminPanelLink variant="ghost" size="sm" />}
                <Button asChild variant="ghost" size="sm">
                  <Link href="/cuenta/listas" className="gap-1.5">
                    <ListMusic className="h-4 w-4" />
                    Mis listas
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/cuenta/listas/mis-favoritos" className="gap-1.5">
                    <Heart className="h-4 w-4" />
                    Favoritos
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/cuenta/preferencias" className="gap-1.5">
                    <User className="h-4 w-4" />
                    {profile?.display_name ?? "Mi cuenta"}
                  </Link>
                </Button>
                <Button asChild variant="accent" size="sm">
                  <Link href="/productos/nuevo">+ Producto</Link>
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

      <MobileBottomNav />
    </>
  );
}
