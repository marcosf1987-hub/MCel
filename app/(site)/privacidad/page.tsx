export const metadata = { title: "Privacidad" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 prose prose-sm">
      <h1 className="text-2xl font-bold">Política de privacidad</h1>
      <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
        CeliApp recopila únicamente los datos necesarios para operar la plataforma:
        email y perfil de autenticación (vía Supabase Auth), evaluaciones, imágenes de
        productos y preferencias de usuario.
      </p>
      <h2 className="mt-6 font-semibold">Datos que almacenamos</h2>
      <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
        <li>Información de cuenta (email, nombre para mostrar)</li>
        <li>Evaluaciones y puntuaciones de productos</li>
        <li>Imágenes subidas por usuarios</li>
        <li>Preferencias de notificación y visibilidad del perfil</li>
      </ul>
      <h2 className="mt-6 font-semibold">Tus derechos</h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Podés solicitar la eliminación de tu cuenta y datos contactando al administrador
        del sitio. Las evaluaciones anónimas agregadas pueden conservarse sin identificar
        al autor.
      </p>
      <h2 className="mt-6 font-semibold">Servicios de terceros</h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Utilizamos Supabase (hosting y base de datos), Open Food Facts (datos de productos
        por código de barras) y opcionalmente OpenAI (resúmenes de evaluaciones).
      </p>
    </div>
  );
}
