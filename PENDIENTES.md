# Pendientes — MCel

## Admin / roles

- [x] **Fase A:** `app_role`, suspensión, soft delete, RLS staff, `/admin`, audit log.
- [x] **Fase B:** Panel `/admin/reports`, resolver/descartar, ocultar contenido.
- [ ] **Fase C:** ABM catálogo + cola imágenes `needs_review`.
- [ ] **Fase D:** Dashboard KPIs con evolución temporal.

## Listas sociales (Fase 4+)

- [ ] Notificaciones cuando alguien comenta o vota tu lista.
- [ ] Ordenar feed por relevancia (no solo `updated_at`).
- [ ] Roles de colaborador (solo lectura vs editor).

## Imágenes de producto

- [x] **IA — ranking de fotos:** batch nocturno (Gemini free + heurísticas), pool candidato de 10, ocultar OFF bajo umbral 40 si hay alternativas.
- [ ] UI admin para cola `needs_review` y override `manual`.

## Otras ideas (backlog)

- Packshots oficiales por acuerdo con marcas (`is_official: true` solo para assets verificados).
- Probar APIs alternativas de barcode (UPCitemdb, etc.) solo como fallback de metadatos, no como portada automática.
