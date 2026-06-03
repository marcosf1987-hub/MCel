# Guía Supabase para Celíacos AR (paso a paso)

## 1. Entrar a tu proyecto

1. Abrí [https://supabase.com](https://supabase.com) e iniciá sesión.
2. Clic en tu proyecto (el que creaste para esta app).

---

## 2. Ejecutar las migraciones SQL (tablas)

### Si al ejecutar `001_initial_schema.sql` sale:
`ERROR: type "user_tier" already exists`

**Eso está bien** — significa que ese archivo **ya se ejecutó antes**. No lo vuelvas a correr.

Solo ejecutá lo que falte:

1. Menú **SQL Editor** → **New query**
2. Copiá y **Run** el contenido de:
   - `supabase/migrations/002_fix_auth_profile.sql` (registro de usuarios)
   - `supabase/migrations/003_storage_bucket.sql` (fotos)
   - `supabase/migrations/004_product_collaborations.sql` (altas de producto cuentan como colaboración)
   - `supabase/migrations/005_price_range.sql` (rango de precio $–$$$$ en evaluaciones)
   - `supabase/migrations/006_product_images_sort_update.sql` (reordenar fotos: comunidad portada, OFF al final si ya hay imágenes)

> Copiá el **texto SQL** del archivo, no la ruta `c:\Users\...`

---

## 3. Verificar el bucket de imágenes (Storage)

1. Menú izquierdo → **Storage**.
2. Deberías ver un bucket llamado **`product-images`**.
3. Si **no existe**:
   - Clic **New bucket**
   - Name: `product-images`
   - Marcar **Public bucket** ✓
   - Clic **Create bucket**
4. O ejecutá el SQL del paso 2 (`003_storage_bucket.sql`).

---

## 4. Verificar que hay tablas

1. Menú → **Table Editor**.
2. Deberías ver tablas como: `profiles`, `products`, `reviews`, `brands`, etc.
3. Si no hay tablas, repetí el paso 2 con `001_initial_schema.sql`.

---

## 5. Variables en Vercel

En [vercel.com](https://vercel.com) → tu proyecto → **Settings** → **Environment Variables**:

| Variable | Dónde copiarla en Supabase |
|----------|---------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role (secreta) |
| `NEXT_PUBLIC_SITE_URL` | Tu URL de Vercel, ej. `https://m-cel.vercel.app` |

Después: **Deployments** → **Redeploy**.

---

## 6. Probar si la API funciona (diagnóstico)

Con la web abierta y **logueado**, en el navegador del celular o PC abrí:

```
https://TU-URL.vercel.app/api/reviews
```

Deberías ver algo como:

```json
{"ok":true,"api":true,"env":true,"loggedIn":true,...}
```

- Si ves **HTML** o error 404 → el deploy no tiene el código nuevo. Hacé `git push` y Redeploy.
- Si `"loggedIn":false` → cerrá sesión, volvé a entrar.
- Si `"env":false` → faltan variables en Vercel.

---

## 7. Login en producción (Supabase Auth)

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL:** `https://tu-url.vercel.app`
3. **Redirect URLs**, agregar:
   - `https://tu-url.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (solo para probar en PC)

---

## ¿Necesitás ayuda?

Si algo falla, anotá:
- Qué ves al abrir `/api/reviews` en el navegador
- El mensaje de error exacto al publicar evaluación
