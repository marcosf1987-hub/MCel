import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewProductForm } from "@/components/product/new-product-form";

export const metadata = { title: "Cargar producto" };

export default async function NewProductPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?returnUrl=/productos/nuevo");

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Cargar nuevo producto</h1>
      <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
        Escaneá el código con la cámara o ingresalo manualmente para obtener datos automáticos.
      </p>
      <NewProductForm />
    </div>
  );
}
