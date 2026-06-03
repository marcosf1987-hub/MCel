# Manual de marca — MCel / Celíacos AR

## Paleta

| Rol | Hex | Uso |
|-----|-----|-----|
| **Primary** | `#ED6C52` | CTAs de acción, acentos, anillos de foco, FAB |
| **Primary dark** | `#C54B3A` | Botón primary sólido |
| **Secondary** | `#6FBF75` | Éxito, certificación, estados positivos |
| **Tertiary** | `#FEF9F1` | Fondos suaves, cards, inputs readonly |
| **Neutral** | `#303030` | Texto, títulos, botón inverted |

## Tipografía

- **Headline:** Libre Caslon Text
- **Body / Label:** DM Sans

## Botones (`components/ui/button.tsx`)

| Variante | Estilo |
|----------|--------|
| `default` | Primary dark, texto blanco |
| `accent` | Primary coral, texto blanco |
| `secondary` | Gris claro `#EBEBEB` |
| `inverted` | Neutral `#303030` |
| `outline` | Borde primary, fondo blanco |

## Tokens CSS

Definidos en `app/globals.css`. Alias legacy (`--color-brown`, `--color-accent`, `--color-brand-cream`) apuntan a la nueva paleta para no romper componentes existentes.

## PWA

- `theme_color`: `#ED6C52`
- `background_color`: `#FEF9F1`
- Iconos: `public/icon.svg` → `npm run prebuild` regenera PNG
