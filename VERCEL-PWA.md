# PWA en Vercel

## Qué incluye

- `manifest.json` con iconos 192/512
- Service worker (`public/sw.js`, generado en build con Serwist)
- Página `/offline` cuando no hay red
- Banner “Agregar a inicio” (Chrome/Android)
- Metadatos Apple para “Añadir a pantalla de inicio” en iOS

## Deploy

1. `npm install` (instala `@serwist/next`, `serwist`, `sharp`)
2. `git push` → Vercel ejecuta `prebuild` (regenera iconos desde `icon.svg`) y `next build` (genera `sw.js`)

## Probar

- Producción HTTPS: Chrome → menú → **Instalar aplicación**
- Lighthouse → categoría **PWA**
- Sin red: abrir una página visitada antes; si falla, debería mostrarse `/offline`

## Nota

El service worker está **desactivado en desarrollo** (`npm run dev`). Probá con `npm run build && npm start` o en Vercel.
