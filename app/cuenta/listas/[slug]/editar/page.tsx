import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEditableListBySlug, getListCollaborators } from "@/lib/lists-server";
import { ListForm } from "@/components/lists/list-form";
import { ListItemsEditor } from "@/components/lists/list-items-editor";
import { ListCollaboratorsEditor } from "@/components/lists/list-collaborators-editor";
import { DeleteListButton } from "@/components/lists/delete-list-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export const metadata = { title: "Editar lista" };

export default async function EditListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?returnUrl=/cuenta/listas/${slug}/editar`);

  const editable = await getEditableListBySlug(supabase, user.id, slug);
  if (!editable) notFound();
  const { list, isOwner } = editable;

  let collaborators: Awaited<ReturnType<typeof getListCollaborators>> = [];
  if (isOwner && !list.is_system) {
    try {
      collaborators = await getListCollaborators(supabase, list.id);
    } catch {
      collaborators = [];
    }
  }

  const { data: items } = await supabase
    .from("product_list_items")
    .select(
      `
      product_id, sort_order,
      products (name, slug)
    `
    )
    .eq("list_id", list.id)
    .order("sort_order", { ascending: true });

  const editorItems = (items ?? [])
    .map((row) => {
      const p = Array.isArray(row.products) ? row.products[0] : row.products;
      if (!p) return null;
      return {
        productId: row.product_id,
        name: (p as { name: string }).name,
        slug: (p as { slug: string }).slug,
      };
    })
    .filter(Boolean) as { productId: string; name: string; slug: string }[];

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <Link
        href={`/cuenta/listas/${slug}`}
        className="inline-block text-sm text-[var(--color-primary)] hover:underline"
      >
        ← {list.title}
      </Link>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Datos de la lista</CardTitle>
          </CardHeader>
          <CardContent>
            <ListForm
              mode="edit"
              listId={list.id}
              initial={{
                title: list.title,
                description: list.description ?? "",
                visibility: list.visibility,
                isSystem: list.is_system,
              }}
            />
          </CardContent>
        </Card>
      )}

      {!isOwner && (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Colaborás en esta lista: podés editar los productos, no el título ni la visibilidad.
        </p>
      )}

      {isOwner && !list.is_system && (
        <Card>
          <CardHeader>
            <CardTitle>Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <ListCollaboratorsEditor
              listId={list.id as string}
              initialCollaborators={collaborators}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Productos en la lista</CardTitle>
        </CardHeader>
        <CardContent>
          <ListItemsEditor listId={list.id} items={editorItems} />
        </CardContent>
      </Card>

      {isOwner && !list.is_system && (
        <DeleteListButton listId={list.id} listTitle={list.title} />
      )}
    </div>
  );
}
