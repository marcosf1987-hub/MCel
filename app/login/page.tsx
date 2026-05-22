import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  const { returnUrl } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
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
