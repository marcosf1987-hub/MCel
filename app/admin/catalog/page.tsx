import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Catálogo — Admin" };

const SECTIONS = [
  {
    href: "/admin/catalog/products",
    title: "Productos",
    description: "Buscar, editar taxonomía, ocultar o restaurar productos.",
  },
  {
    href: "/admin/catalog/brands",
    title: "Marcas",
    description: "Crear, renombrar o eliminar marcas sin productos activos.",
  },
  {
    href: "/admin/catalog/categories",
    title: "Categorías",
    description: "Gestionar categorías y subcategorías del catálogo.",
  },
];

export default function AdminCatalogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
          Catálogo
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          ABM de productos, marcas y categorías. Solo admin y superadmin.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Link
        href="/admin"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← Volver al resumen
      </Link>
    </div>
  );
}
