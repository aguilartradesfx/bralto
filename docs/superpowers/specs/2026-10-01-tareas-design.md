# Sección "Tareas" del panel admin

**Fecha:** 2026-10-01 · **Estado:** aprobado por Alejandro en el chat (sin revisión del documento, a pedido suyo)

## Objetivo

Que Alejandro vea en qué trabaja su equipo: los admins crean tareas (con ayuda de IA para formularlas), las asignan, y cada colaborador reporta avances diarios dentro de sus tareas y las lleva hasta "En revisión"; un admin las aprueba o las devuelve.

## Decisiones (tomadas en el brainstorming)

- **Avances:** se escriben dentro de cada tarea (historial con fecha). Una vista "Hoy" agrupa los avances del día por persona (zona horaria Costa Rica, UTC−6).
- **Visibilidad:** cada colaborador ve **solo sus tareas**. Los admins (`is_admin`) ven todas, crean, asignan, editan y borran.
- **Cierre con revisión:** Pendiente → En progreso → En revisión → Hecha, más Bloqueada. Solo un admin pasa a Hecha o devuelve (En revisión → En progreso, con comentario obligatorio).
- **IA:** la idea suelta se convierte en título + descripción + checklist de "terminada" + prioridad sugerida; el admin revisa y edita antes de guardar. Claude Opus 5.5 con salida estructurada, esfuerzo `low`, `fallbacks: "default"`. Costo ≈ 1–2 centavos por formulación.
- **Correos (Resend, `tareas@send.bralto.io`):** al colaborador cuando se le asigna; al creador cuando pasa a En revisión; al colaborador cuando se devuelve; al creador cuando se bloquea (con motivo). Nunca se avisa a quien hizo la acción.

## Datos

Tabla `tasks`: `id`, `title` (no vacío), `description`, `checklist` (jsonb array `[{text, done}]`), `priority` (`baja|normal|alta|urgente`), `status` (`pendiente|en_progreso|bloqueada|en_revision|hecha`), `assignee_id` → `auth.users` (null = sin asignar), `created_by` → `auth.users`, `due_date` (date, opcional), `completed_at`, `created_at`, `updated_at` (trigger `update_updated_at()` existente).

Tabla `task_updates`: `id`, `task_id` (cascade), `author_id`, `kind` (`avance|estado|devolucion|bloqueo`), `body`, `from_status`, `to_status`, `created_at`.

`user_profiles.can_view_tasks boolean not null default true` (nuevo permiso, activo para todos).

Ambas tablas con RLS activado y **sin políticas**: solo el service role (APIs del panel) las lee/escribe. Índices en las FK y en `task_updates.created_at` (vista Hoy).

## Reglas (lógica pura, con tests)

Transiciones del responsable (no admin):
- pendiente → en_progreso | bloqueada
- en_progreso → en_revision | bloqueada
- bloqueada → en_progreso
- en_revision, hecha → (ninguna; espera al admin)

Admin: cualquier transición entre estados distintos.

Nota obligatoria: pasar a `bloqueada` (motivo) y la devolución de admin `en_revision → en_progreso` (comentario). La devolución se registra como `kind = devolucion`; el bloqueo como `bloqueo`; el resto como `estado`. Pasar a `hecha` fija `completed_at`; salir de `hecha` lo limpia.

Ver tarea: admin, o `assignee_id === usuario`.

Editar contenido (título, descripción, ítems del checklist, prioridad, fecha, responsable): solo admin. Marcar/desmarcar ítems del checklist: admin o responsable.

## Pantallas

- `/tareas`: admin → tablero por columnas de estado con filtro por persona (`?persona=<id>`, `?persona=sin`); colaborador → "Mis tareas" agrupadas por estado (Hecha colapsada al final).
- `/tareas/nueva` (admin): idea → "Formular con IA" → formulario editable (título, descripción, checklist, prioridad, responsable, fecha) → Guardar.
- `/tareas/[id]`: detalle, checklist marcable, historial, "Agregar avance", botones de estado según rol; admin: Editar y Borrar.
- `/tareas/[id]/editar` (admin): mismo formulario precargado.
- `/tareas/hoy` (admin): avances (`kind = avance`) del día CR agrupados por persona, con link a cada tarea.
- Menú "Tareas" y tarjeta en `/admin`. Prefijo `/tareas` en el ruteo por host y permiso `can_view_tasks`.

## APIs (todas con `requireApiPermission('can_view_tasks')` + regla de rol)

- `POST /api/tasks/formulate` (admin) `{ idea }` → borrador (no guarda).
- `POST /api/tasks` (admin) crear · `PATCH /api/tasks/[id]` (admin) editar · `DELETE /api/tasks/[id]` (admin).
- `POST /api/tasks/[id]/status` `{ to, note? }` (admin o responsable, según reglas).
- `POST /api/tasks/[id]/updates` `{ body }` (admin o responsable) — avance.
- `PATCH /api/tasks/[id]/checklist` `{ index, done }` (admin o responsable).

Correos en segundo plano con `after()`; un fallo de correo no rompe la acción.

## Verificación

- `node --test`: transiciones, nota obligatoria, visibilidad, destinatarios de correos, rango del día CR, normalización del borrador de IA.
- `tsc`, `next build`.
- IA probada con 2–3 ideas reales.
- Preview de Vercel con sesión: crear, asignar, avanzar, bloquear, revisar, devolver, aprobar.

## Paso a producción

1. Migración SQL aditiva (aplicada por el pooler con `SUPABASE_DB_PASSWORD`).
2. `ANTHROPIC_API_KEY` en `.env.local` y en Vercel (production + preview).
3. PR → preview → merge.

## Fuera de alcance

Subtareas, comentarios libres fuera de avances, adjuntos, notificaciones en el panel (solo correo), estimaciones de tiempo, sugerencia automática de responsable.
