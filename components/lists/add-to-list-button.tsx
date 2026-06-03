"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type UserList = {
  id: string;
  title: string;
  slug: string;
  is_system: boolean;
};

export function AddToListButton({
  productId,
  isLoggedIn,
}: {
  productId: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(false);
  const [inLists, setInLists] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !isLoggedIn) return;
    void (async () => {
      const res = await fetch(`/api/lists?productId=${encodeURIComponent(productId)}`, {
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        lists?: UserList[];
        containingListIds?: string[];
      };
      if (data.ok && data.lists) {
        setLists(data.lists);
        setInLists(new Set(data.containingListIds ?? []));
      }
    })();
  }, [open, isLoggedIn, productId]);

  const toggleProduct = async (listId: string, add: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(
        add ? `/api/lists/${listId}/items` : `/api/lists/${listId}/items?productId=${productId}`,
        {
          method: add ? "POST" : "DELETE",
          credentials: "include",
          headers: add ? { "Content-Type": "application/json" } : undefined,
          body: add ? JSON.stringify({ productId }) : undefined,
        }
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Error");

      setInLists((prev) => {
        const next = new Set(prev);
        if (add) next.add(listId);
        else next.delete(listId);
        return next;
      });
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo actualizar la lista");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen((o) => !o)}
      >
        <ListPlus className="h-4 w-4" />
        Agregar a lista
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-xl">
            <p className="px-2 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
              Tus listas
            </p>
            <ul className="max-h-48 overflow-y-auto">
              {lists.map((list) => {
                const has = inLists.has(list.id);
                return (
                  <li key={list.id}>
                    <button
                      type="button"
                      disabled={loading}
                      className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--color-brand-cream)]"
                      onClick={() => void toggleProduct(list.id, !has)}
                    >
                      {list.title}
                      {has ? " ✓" : ""}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/cuenta/listas/nueva"
              className="mt-1 block rounded-lg px-2 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-brand-cream)]"
              onClick={() => setOpen(false)}
            >
              + Nueva lista
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
