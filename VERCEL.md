# Despliegue en Vercel

## Variables de entorno (obligatorias)

En Vercel → proyecto → **Settings** → **Environment Variables**, agregá:

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave `anon` public |
| `SUPABASE_SERVICE_ROLE_KEY` | clave `service_role` (solo servidor) |
| `NEXT_PUBLIC_SITE_URL` | `https://TU-PROYECTO.vercel.app` |
| `OPENAI_API_KEY` | opcional (resúmenes de evaluaciones) |
| `GEMINI_API_KEY` | opcional (ranking estético de fotos; sin key usa solo heurísticas) |
| `CRON_SECRET` | secreto para el cron nocturno de ranking de fotos (`/api/cron/rank-images`, 00:00 ART) |

Marcá las cuatro primeras para **Production**, **Preview** y **Development**.

Después de guardar: **Deployments** → los tres puntos del último deploy → **Redeploy**.

**Importante:** las variables `NEXT_PUBLIC_*` se aplican al **nuevo deploy**. Si agregaste variables después del primer deploy exitoso, siempre hacé **Redeploy**.

`NEXT_PUBLIC_SITE_URL` debe ser tu URL de Vercel (ej. `https://m-cel.vercel.app`), no `http://localhost:3000`.

## Supabase (login en producción)

Authentication → URL Configuration:

- **Site URL**: `https://TU-PROYECTO.vercel.app`
- **Redirect URLs**: `https://TU-PROYECTO.vercel.app/auth/callback`
