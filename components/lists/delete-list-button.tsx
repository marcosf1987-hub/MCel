"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteListButton({
  listId,
  listTitle,
}: {
  listId: string;
  listTitle: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !window.confirm(
        `¿Eliminar la lista «${listTitle}»? Los productos no se borran del catálogo.`
      )
    ) {
      return;
    }

    const res = await fetch(`/api/lists/${listId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      window.alert(data.error ?? "No se pudo eliminar");
      return;
    }
    router.push("/cuenta/listas");
    router.refresh();
  };

  return (
    <Button type="button" variant="destructive" onClick={() => void handleDelete()}>
      Eliminar lista
    </Button>
  );
}
