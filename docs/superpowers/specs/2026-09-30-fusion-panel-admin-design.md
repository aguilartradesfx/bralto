# Fusión del panel admin (Linkedin React → Bralto)

**Fecha:** 2026-09-30 · **Estado:** aprobado por Alejandro (sin revisión del documento, a pedido suyo)

## Objetivo

Un solo repo y un solo deploy (Bralto) que sirve el sitio público en `bralto.io` y el panel de colaboradores en `admin.bralto.io`. El panel es la base donde se irán sumando herramientas internas. El repo "Linkedin React" (hoy desplegado en `admin.bralto.io`) queda obsoleto.

`app.bralto.io` es la cuenta white label de GHL y **no se toca**.

## Contexto

- Ambos repos usan el mismo proyecto de Supabase (`pjwmfllnyauobityaile`). No hay migración de datos.
- Linkedin React copió el panel de Bralto el 2026-04-24 y ambos divergieron. Bralto tiene las versiones más completas de contratos, login e inicio; Linkedin React agregó permisos por rol, solicitudes, generador de propuestas y el agente de LinkedIn.

## Decisiones

### 1. Ruteo por dominio (host)

El middleware clasifica cada request según el host:

| Host | Comportamiento |
|---|---|
| `admin.bralto.io` | Sirve panel + `/login`. `/` → `/admin`. Cualquier otra ruta de página (sitio público, `/c/*`, `/propuestas/<slug>`) → 308 a `https://bralto.io<ruta>`. |
| `bralto.io`, `www.bralto.io` | Sitio público igual que hoy (i18n, calendario, `/c/[slug]`, `/propuestas/[slug]`). Rutas de panel + `/login` → 308 a `https://admin.bralto.io<ruta>`. |
| Cualquier otro (`localhost`, `*.vercel.app`) | Sirve todo sin redirecciones cruzadas (para desarrollo y previews). En local el panel se prueba igual en `localhost:3000/admin`. |

- Rutas de panel: `/admin`, `/contratos`, `/clientes`, `/solicitudes`, `/propuestas` (solo la ruta exacta; `/propuestas/<slug>` es pública), `/usuarios`, `/login`.
- `/api/*` no se redirige en ningún host: cada route handler valida su propia auth. Así `admin.bralto.io/api/proposals/:id/accept` (usado por propuestas ya enviadas) sigue funcionando.
- La lógica de decisión vive en una función pura (`lib/host-routing.ts`) con tests; el middleware solo la aplica.

### 2. Auth y permisos

- Se adopta el modelo de Linkedin React: tabla `user_profiles` (ya existe en la DB) con `is_admin` + flags por sección. `is_admin` ve todo.
- Mapa ruta → permiso: `/contratos` `can_view_contracts`, `/clientes` `can_view_clients`, `/solicitudes` `can_submit_proposals`, `/propuestas` `can_view_proposals`, `/usuarios` `is_admin`. `/admin` solo requiere sesión.
- El menú lateral muestra solo las secciones permitidas (patrón de Linkedin React).
- `can_view_linkedin` deja de usarse en código (la columna queda en la DB).
- Antes del corte se consulta (solo lectura) `user_profiles` para listar usuarios y permisos y confirmarlos con Alejandro.

### 3. Qué se trae, qué se queda, qué se elimina

**Se trae de Linkedin React** (adaptado al estilo visual del panel de Bralto: fondo `#060607`, acento `#5bb6ff`):
- `app/(internal)/solicitudes` (lista + nueva), `app/(internal)/usuarios`
- `components/proposals/{proposal-form,solicitudes-dashboard}.tsx`, `components/users/user-management.tsx`
- `app/api/proposals/{route.ts,[id]/route.ts,[id]/accept/route.ts,[id]/generated/route.ts,generate/route.ts}`, `app/api/users/{route.ts,[id]/route.ts}`
- `lib/proposals/render-template.ts`, `templates/proposals/template.html`, `types/proposals.ts`, `types/user-profiles.ts`
- Nav + layout con permisos

**Se queda de Bralto:** contratos, clientes, login, inicio del panel, emails, `lib/contracts`, `/c/[slug]`, `/api/bookings`, `/api/proposals/receive`, `/propuestas/[slug]`.

**Se elimina:**
- Todo lo de LinkedIn (en Bralto: `app/(internal)/linkedin-pipeline`, `components/linkedin`, `types/linkedin.ts`; de Linkedin React no se trae nada del agente, webhooks Botdog/Unipile, cola, conversaciones, prospects, messages, agent config).
- Social Parasite (`/api/social/generate-image`) — no se trae.
- Nala completo: `app/adopcion-nala`, `app/api/nala`, `app/(internal)/submissions-nala`, `components/nala`, `lib/nala`, `public/nala-cover.webp`, `NALA.jpg`, migración `20260714_001_nala_submissions.sql`. Se respalda en `.local-backups/` antes de borrar (nunca estuvo commiteado).
- `app/api/proposals/[slug]/route.ts` de Bralto (DELETE por slug con API key; su único consumidor era Linkedin React) — además choca con `[id]`.
- `app/propuestas/page.tsx` y `app/propuestas/actions.ts` de Bralto (reemplazados por la lista unificada).

**Base de datos:** no se borra ni altera ninguna tabla. Tablas de LinkedIn, agente y Nala quedan sin uso.

### 4. Propuestas

- **Lista unificada** en `/propuestas` (panel): todas las filas de `generated_proposals`. Si una propuesta corresponde a una `proposal_requests` (match por slug extraído de `proposal_requests.generated_url`), muestra además servicios, quién la solicitó y estado (incl. aceptada). Permite copiar link, abrir y eliminar.
- **Generar** (`/api/proposals/generate`): inserta directo en `generated_proposals` vía una función compartida (`lib/proposals/publish.ts`) que también usa `/api/proposals/receive`. Se elimina la llamada HTTP a `BRALTO_API_URL`.
- **Eliminar publicada**: server action en la lista de propuestas; borra directo en `generated_proposals` (ver "Ajustes durante la implementación").
- **Aceptar** (`/api/proposals/[id]/accept`): sin cambios de lógica (CORS para `bralto.io`/`www.bralto.io`, webhook n8n, emails). `render-template.ts` mantiene `https://admin.bralto.io` como base del endpoint de aceptación.
- La URL pública de una propuesta se construye con `NEXT_PUBLIC_SITE_URL` (en prod `https://bralto.io`).

## Verificación

- Tests de `lib/host-routing.ts` con `node --test` (Node 24, TS nativo), script `npm test`.
- `npx tsc --noEmit` y `next build` pasan.
- Prueba manual en local y en preview de Vercel: login, cada sección según permisos, generar propuesta desde una solicitud, lista unificada, aceptar una propuesta, link de firma de contrato, sitio público en ambos idiomas.

## Paso a producción

1. Trabajo en la rama `feat/fusion-panel-admin`. Los cambios pendientes ajenos a esta fusión (Quickhire, `Frames 2`, `_para-revisar/`, `Samples/`) no se commitean.
2. Merge a `main` → deploy de `bralto.io`. Las rutas de panel en `bralto.io` redirigen a `admin.bralto.io`, que en ese momento sigue siendo la app vieja (funciona).
3. En Vercel: quitar `admin.bralto.io` del proyecto viejo y agregarlo al de Bralto (con OK explícito de Alejandro en el momento).
4. Checklist de verificación en producción.
5. Rollback: devolver el dominio al proyecto viejo (queda desplegado sin cambios).
6. Tras 1–2 semanas estable: archivar el repo Linkedin React, borrar su proyecto en Vercel, revocar el token de GitHub embebido en su remote.

## Ajustes durante la implementación

- Las redirecciones entre hosts son **307** (no 308) para que un rollback del dominio no quede cacheado en navegadores.
- El destino público de las redirecciones es `https://www.bralto.io` (dominio canónico; `bralto.io` ya redirige ahí en Vercel).
- `/c/` se agregó a las rutas fuera del árbol de idiomas: hoy `www.bralto.io/c/<slug>` redirige a `/es/c/<slug>` y da 404. Con esto los links de firma (incluidos los viejos `admin.bralto.io/c/<slug>`, que ahora redirigen) funcionan.
- `/api/proposals/[id]/generated` no se portó: borrar una propuesta publicada lo hace la server action `deleteProposal` de `app/(internal)/propuestas/actions.ts` (borra en `generated_proposals` y limpia `generated_url` de la solicitud).
- `/login` y `/propuestas` en `localhost` ya no pasan por la redirección de idioma (antes daban 404 en `www.bralto.io`).
- Usuarios sin fila en `user_profiles` (hoy: `alinaramirezgamboa@gmail.com`, `josuea421@gmail.com`) solo ven "Inicio" hasta que un admin les asigne permisos en `/usuarios`.

## Fuera de alcance

- Borrar tablas de la DB.
- Cambiar la paleta del panel al naranja de marca.
- Unificar emails de propuestas con la plantilla de emails de contratos.
- `emailProposalSent` / `FROM_PROPOSALS` (cambios sin commitear en Linkedin React que ningún código usa).
