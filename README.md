# Celíacos AR

Plataforma comunitaria para descubrir, evaluar y puntuar productos aptos para personas celíacas en Argentina/LATAM.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Supabase** — Auth (Google + email), PostgreSQL, Storage
- **Open Food Facts** — lookup por código de barras
- **html5-qrcode** — escáner de barras en el navegador
- **OpenAI** (opcional) — resúmenes IA de evaluaciones

## Configuración

### 1. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com)
2. Ejecutá en el SQL Editor, en orden:
   - [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
   - [`supabase/migrations/002_fix_auth_profile.sql`](supabase/migrations/002_fix_auth_profile.sql) (corrige error al registrarse)
3. En **Authentication → Providers**, habilitá Google y Email
4. Añadí la URL de callback: `http://localhost:3000/auth/callback`

### 2. Variables de entorno

Copiá `.env.example` a `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...   # opcional, hay resumen fallback sin IA
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Instalar y ejecutar

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

## Funcionalidades

- Login con Google o email/contraseña
- Escaneo de código de barras + lookup Open Food Facts
- Alta manual si el producto no está en OFF
- Evaluaciones 1–5 con peso por nivel (0.7 / 1 / 1.3 / 1.55)
- Badges Bronce (10+), Plata (50+), Oro (100+)
- Ficha pública con última reseña; todas las reseñas requieren login
- Buscador y menú por marca / categoría / subcategoría
- Resumen IA de evaluaciones (con fallback sin API key)
- PWA instalable (manifest, service worker, offline), reportes, disclaimer médico, filtro SIN TACC

## PWA

Tras `npm install`, el build genera el service worker y los iconos PNG. Ver [VERCEL-PWA.md](VERCEL-PWA.md).

## Deploy

- **Frontend**: [Vercel](https://vercel.com) — conectá el repo y las env vars
- **Backend**: Supabase (ya hospedado)

## Estructura

```
app/           # Rutas Next.js
components/    # UI y componentes de producto
lib/           # Supabase, OFF, ratings, IA
supabase/      # Migraciones SQL
types/         # Tipos TypeScript
```
