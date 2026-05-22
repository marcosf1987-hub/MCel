import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string; error?: string }>;
}) {
  const { returnUrl, error } = await searchParams;
  const env = getSupabasePublicEnv();

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      {!env.ok && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>Configuración:</strong> {env.error}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {decodeURIComponent(error)}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            Accedé con Google o email para evaluar productos y ver todas las opiniones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm returnUrl={returnUrl ?? "/"} />
        </CardContent>
      </Card>
    </div>
  );
}
