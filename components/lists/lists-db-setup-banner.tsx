import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ListsDbSetupBanner() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Listas no disponibles todavía</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[var(--color-muted-foreground)]">
          <p>
            Falta aplicar la migración de listas en Supabase (
            <code className="text-xs">007_product_lists.sql</code>).
          </p>
          <p>
            Si sos la persona que administra el proyecto, ejecutala en SQL Editor. Si
            ya la ejecutaste, probá de nuevo en unos minutos.
          </p>
          <Link href="/cuenta/preferencias" className="font-medium text-[var(--color-primary)] hover:underline">
            ← Volver a Mi cuenta
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
