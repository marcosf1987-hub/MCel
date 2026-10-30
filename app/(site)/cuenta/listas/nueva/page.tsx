import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ListForm } from "@/components/lists/list-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Nueva lista" };

export default async function NewListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?returnUrl=/cuenta/listas/nueva");

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/cuenta/listas"
        className="mb-4 inline-block text-sm text-[var(--color-primary)] hover:underline"
      >
        ← Mis listas
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Nueva lista</CardTitle>
        </CardHeader>
        <CardContent>
          <ListForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
