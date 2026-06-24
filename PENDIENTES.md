# Pendientes — MCel

## Admin / roles

- [x] **Fase A:** `app_role`, suspensión, soft delete, RLS staff, `/admin`, audit log.
- [x] **Fase B:** Panel `/admin/reports`, resolver/descartar, ocultar contenido.
- [x] **Fase C:** ABM catálogo (`/admin/catalog`) + cola imágenes (`/admin/images`).
- [x] **Fase D:** Dashboard `/admin/analytics` con KPIs y evolución temporal.
- [x] **Fase E:** Gestión usuarios (`/admin/users`), suspensión, roles y export GDPR.

## Listas sociales (Fase 4+)

- [x] Notificaciones cuando alguien comenta o vota tu lista (`/cuenta/notificaciones`).
- [x] Ordenar feed por relevancia (`/cuenta/feed?sort=relevant|recent`).
- [x] Roles de colaborador (solo lectura vs editor).

## Imágenes de producto

- [x] **IA — ranking de fotos:** batch nocturno (Gemini free + heurísticas), pool candidato de 10, ocultar OFF bajo umbral 40 si hay alternativas.
- [x] UI admin para cola `needs_review` y override `manual` (`/admin/images`).

## Otras ideas (backlog)

- Packshots oficiales por acuerdo con marcas (`is_official: true` solo para assets verificados).
- Probar APIs alternativas de barcode (UPCitemdb, etc.) solo como fallback de metadatos, no como portada automática.
