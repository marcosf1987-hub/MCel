"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import { CategoryMegaMenu } from "@/components/layout/category-mega-menu";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { NotificationBellLink } from "@/components/lists/notification-bell-link";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import { AdminPanelLink } from "@/components/admin/admin-panel-link";
import { createClient } from "@/lib/supabase/client";
import type { CategoriesNavData } from "@/lib/categories-types";
import type { AppRole } from "@/types/database";
import { Wheat, Heart, User, ListMusic, MapPin } from "lucide-react";

type HeaderSession = {
  displayName: string;
  unread: number;
  showAdmin: boolean;
};

export function Header({ categories }: { categories: CategoriesNavData }) {
  const session = useHeaderSession();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-md shadow-sm">
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

          <MobileAuth session={session} />
        </div>

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

          <CategoryMegaMenu data={categories} />

          <div className="mx-2 max-w-md flex-1">
            <SearchBar />
          </div>

          <nav className="ml-auto flex shrink-0 items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/locales" className="gap-1.5">
                <MapPin className="h-4 w-4" />
                Locales
              </Link>
            </Button>
            <DesktopAuth session={session} />
          </nav>
        </div>
      </header>

      <MobileBottomNav />
    </>
  );
}

function useHeaderSession(): HeaderSession | null | undefined {
  const [session, setSession] = useState<HeaderSession | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setSession(null);
          return;
        }

        const [{ data: profile }, listCount, modCount] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name, app_role")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("list_notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .is("read_at", null),
          supabase
            .from("user_notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .is("read_at", null),
        ]);

        const role = (profile?.app_role ?? "user") as AppRole;
        if (!cancelled) {
          setSession({
            displayName: profile?.display_name?.trim() || "Mi cuenta",
            unread: (listCount.count ?? 0) + (modCount.count ?? 0),
            showAdmin: canAccessAdminPanel(role),
          });
        }
      } catch {
        if (!cancelled) setSession(null);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return session;
}

function MobileAuth({ session }: { session: HeaderSession | null | undefined }) {
  if (session === undefined) {
    return <span className="inline-block h-8 w-16 shrink-0" aria-hidden />;
  }
  if (!session) {
    return (
      <Button asChild size="sm" className="shrink-0 text-xs">
        <Link href="/login">Entrar</Link>
      </Button>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-1">
      {session.showAdmin && <AdminPanelLink variant="ghost" size="icon" showLabel={false} />}
      <NotificationBellLink unreadCount={session.unread} />
    </div>
  );
}

function DesktopAuth({ session }: { session: HeaderSession | null | undefined }) {
  if (session === undefined) {
    return <span className="inline-block h-9 w-28" aria-hidden />;
  }
  if (!session) {
    return (
      <Button asChild size="sm">
        <Link href="/login">Iniciar sesión</Link>
      </Button>
    );
  }
  return (
    <>
      <NotificationBellLink unreadCount={session.unread} />
      {session.showAdmin && <AdminPanelLink variant="ghost" size="sm" />}
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
          {session.displayName}
        </Link>
      </Button>
      <Button asChild variant="accent" size="sm">
        <Link href="/productos/nuevo">+ Producto</Link>
      </Button>
    </>
  );
}
