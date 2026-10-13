# Diseño del admin igual al del sitio

**Fecha:** 2026-10-13 · **Estado:** aprobado por Alejandro en el chat ("Si si dale")

## Objetivo

Que el panel interno (admin.bralto.io: login, menú, Inicio, Contratos, Clientes, Solicitudes, Propuestas, Usuarios y Plan Q4) se vea como www.bralto.io: el sistema liquid glass monocromo, en una versión de trabajo.

## Decisiones

- **Mismo sistema, versión de trabajo:** paleta, fuentes, botones y vidrio ahumado del sitio en el menú, las tarjetas, los modales y el login. Tablas, listas y formularios sobre superficie sólida para que se lean bien. Sin orbes animados ni partículas: fondo negro del sitio con grano y un brillo fijo.
- **Tokens compartidos:** el bloque de tokens de `components/home/home.css` (colores del tema oscuro, vidrio, radios, curvas, fuentes) pasa a `components/home/tokens.css`, que usan el sitio (`.hm`) y el panel (`.pn`). El sitio no cambia.
- **Solo tema oscuro** en el panel (el interruptor claro/oscuro queda fuera).
- **Sin cian:** desaparece `#5bb6ff` / `#7cc5ff` del panel. Botón principal blanco con degradado y texto negro (píldora, como el sitio); secundario de vidrio. Estado activo en blanco; el naranja `#ff6d28` solo como señal (marca del ítem activo del menú) y en el foco del teclado.
- **Estados** verde / ámbar / rojo se quedan (hecho, en revisión, vencida, errores).
- **Fuentes:** Sora (texto) y JetBrains Mono (etiquetas, ids, fechas cortas) en el panel y el login, con `next/font` como el sitio. Dentro de `.pn` las variables de Geist apuntan a estas, así `font-sans` y `font-mono` de Tailwind siguen funcionando.
- **Textos sin cambios:** el panel sigue en voseo y en sentence case.
- **Fuera de alcance:** la hoja blanca del contrato, la página pública de firma (`/c/…`, comparte `signature-pad.tsx`, que no se toca), las propuestas públicas, el tema claro y la rama `feat/tareas` (sin fusionar; necesitará el mismo ajuste).

## Piezas

- `components/home/tokens.css`: tokens compartidos (`.hm, .pn`), con el tema claro solo para `.hm`.
- `app/(internal)/panel.css` (importado por los layouts del panel y del login): fondo `.pn`, alias de fuentes, foco y estas clases:
  - `pn-glass`: vidrio ahumado (menú, tarjetas, modales, login).
  - `pn-solid`: superficie sólida para listas, tablas y menús desplegables.
  - `pn-btn-solid` / `pn-btn-glass`: botones principal y secundario.
  - `pn-chip-on`: estado activo de chips, filtros y pestañas (blanco sobre vidrio interno).
  - `pn-signal`: la marca naranja.
- Tailwind: colores `ink`, `ink-2`, `ink-3`, `rule`, `solid` apuntando a los tokens, para el código nuevo.

## Equivalencias del cian

| Antes | Después |
|---|---|
| Botón `bg-[#5bb6ff] text-black hover:bg-[#7cc5ff]` | `pn-btn-solid` (píldora) |
| Botón suave `bg-[#5bb6ff]/10..20 text-[#5bb6ff]` | `pn-btn-glass` |
| Activo (menú, filtros, pestañas) `bg-[#5bb6ff]/10 text-[#5bb6ff]` | `pn-chip-on` (+ `pn-signal` en el menú) |
| Texto / ícono / link `text-[#5bb6ff]` | `text-white` (hover `text-white/70`) |
| Etiqueta `bg-[#5bb6ff]/10 text-[#5bb6ff] border-[#5bb6ff]/20` | `bg-white/[0.08] text-white border-white/15` |
| Foco de campo `focus:border-[#5bb6ff]/..`, `focus:ring-[#5bb6ff]/..`, `focus:bg-[#5bb6ff]/..` | `focus:border-white/30`, `focus:ring-white/10`, `focus:bg-white/[0.06]` |
| Hover de borde `hover:border-[#5bb6ff]/..` | `hover:border-white/20` |
| Barras de avance / spinners cian | `bg-white/80` / `text-white/60` |
| Superficies `#0c0c0f`, `#131316`, `#111111` | `pn-glass` (menú, modales) o `bg-solid` (campos, desplegables) |
| Fondo `#060607` | el de `.pn` (sin clase) |

## Verificación

- Test que recorre los archivos del panel y falla si queda `5bb6ff`, `7cc5ff`, `cyan` o las superficies viejas.
- `npm test`, `tsc`, `next build`.
- Sitio: los tokens calculados en `.hm` siguen iguales y la portada se ve igual.
- Panel: capturas de cada pantalla en escritorio y a 375 px (sin scroll horizontal).
