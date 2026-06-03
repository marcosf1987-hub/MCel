"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function ListItemsEditor({
  listId,
  items,
}: {
  listId: string;
  items: { productId: string; name: string; slug: string }[];
}) {
  const router = useRouter();

  const remove = async (productId: string) => {
    const res = await fetch(
      `/api/lists/${listId}/items?productId=${encodeURIComponent(productId)}`,
      { method: "DELETE", credentials: "include" }
    );
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      window.alert(data.error ?? "No se pudo quitar el producto");
      return;
    }
    router.refresh();
  };

  if (!items.length) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Esta lista está vacía. Agregá productos desde su ficha con «Agregar a lista».
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
      {items.map((item) => (
        <li
          key={item.productId}
          className="flex items-center justify-between gap-2 px-4 py-3"
        >
          <Link
            href={`/productos/${item.slug}`}
            className="text-sm font-medium text-[var(--color-brown)] hover:underline"
          >
            {item.name}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Quitar de la lista"
            onClick={() => void remove(item.productId)}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
