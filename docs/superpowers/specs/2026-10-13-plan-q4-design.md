# Sección "Plan Q4" del panel admin

**Fecha:** 2026-10-13 · **Estado:** aprobado por Alejandro en el chat ("Dale camino")

Fuente: `plan-q4-admin.md` (instrucciones + contenido del plan), que vive solo en la máquina de Alejandro. Este documento registra cómo se adapta al admin y las decisiones que cambian algo de ese archivo.

## Objetivo

Que Ale, Soshil y Alina naveguen el plan del cuarto trimestre por pestañas y trabajen sus tareas: marcarlas, reasignarlas, cambiar fechas y dejar notas. Alina la usa desde el teléfono.

## Decisiones

- **Separada de Tareas.** Tablas propias (`plan_*`). Las reglas de Tareas (cada quien ve lo suyo, solo admin crea, revisión) no aplican aquí: todo el equipo ve y edita todo.
- **Acceso solo del equipo.** Permiso nuevo `user_profiles.can_view_plan` (default `false`), encendido para Ale y Soshil; Alina al crear su usuario. Casilla en `/usuarios`. Los colaboradores externos no lo ven.
- **Ruta `/plan-q4`** (las secciones del admin viven en la raíz, no bajo `/admin`). Ítem "Plan Q4" en el menú lateral. `noindex` ya lo pone el layout de `(internal)`.
- **El contenido no va al repo** (el repo es público). Vive en Supabase (`plan_content`); el archivo fuente queda fuera de git (`/plan-q4-admin.md` en `.gitignore`). Cambio respecto al archivo, que pedía guardarlo en el repo.
- **Los correos del equipo no van al código:** el seed los lee de `PLAN_Q4_EMAILS` en `.env.local`.
- **RLS activado sin políticas** (patrón del admin): solo las APIs con service role leen y escriben. Cambio respecto al archivo, mismo efecto.
- **Escribir exige estar en `plan_team`** (además del permiso), para que `actualizado_por` siempre sea un slug.
- **Semanas** de lunes a domingo, hora de Costa Rica (UTC−6, sin horario de verano).
- **Tareas creadas desde el panel** se marcan `origen = 'panel'`. Si una versión nueva del plan trae el mismo id, el seed no la pisa: avisa el choque y sigue.

## Parser (`lib/plan-q4/parse.ts`, lógica pura)

Lee el archivo completo; si tiene un encabezado `# Parte 2`, solo procesa lo que viene después. Divide por `## <Clave> — <Título> · <Lectura|Acción>`:

- Clave `B0`…`B12` → pestaña `b0`…`b12`; `Decisiones` (sin clave) → pestaña `decisiones`.
- Dentro de cada bloque: `### Tareas (seed)` (tabla) y `### Contexto` (markdown). La página renderiza solo Contexto con `marked`; el seed lee las tablas.
- Celdas: `\|` es una barra literal; `—` = vacío; fecha `2026-10-16` o `desde 2026-10-12`; tipo `única|semanal`; estado `pendiente|en curso|hecho|—`; responsable/apoyo por nombre (`Ale|Soshil|Alina`). Los títulos se guardan sin escapes de markdown (`\$` → `$`).
- Si algo no cumple el formato, lanza un error con la lista de problemas; el seed no escribe nada.

El encabezado fijo del Resumen y los hitos salen de `### Pestaña Resumen` en la Parte 1 del archivo (`parseResumen`: viñetas `- **Etiqueta:** valor`; la de Hitos como `3 oct texto · 14 nov texto`) y el seed los guarda en `plan_content.resumen`, así las cifras tampoco quedan en el repo.

## Datos (migración aditiva)

```
user_profiles.can_view_plan boolean not null default false

plan_team(slug text pk check in ('ale','soshil','alina'), nombre text, rol text,
          user_id uuid unique null → auth.users on delete set null)

plan_content(id smallint pk check id = 1, markdown text, actualizado_en timestamptz)

plan_tasks(id text pk 'B8-04', bloque text 'b8', titulo text not null,
           responsable text → plan_team(slug), apoyo text null → plan_team(slug),
           fecha date not null, tipo text check in ('unica','semanal'),
           estado text null check in ('pendiente','en_curso','hecho'),
           nota text null, origen text check in ('plan','panel') default 'plan',
           actualizado_por text null → plan_team(slug), actualizado_en timestamptz null,
           created_at timestamptz default now())
  check: (tipo = 'unica') = (estado is not null)
  check: apoyo distinto de responsable

plan_task_weeks(task_id → plan_tasks on delete cascade, week_start date (lunes),
                done boolean, done_by text → plan_team(slug), done_at timestamptz,
                pk (task_id, week_start))
```

RLS activado en las cuatro tablas, sin políticas.

## Seed (`npm run plan:seed`)

Script Node (TypeScript con type stripping) con el service role de `.env.local`. Lee `plan-q4-admin.md` de la raíz (o la ruta que se le pase). `--dry-run` solo valida e imprime el resumen.

1. Parsea el archivo; si hay errores, sale sin escribir.
2. Upsert de `plan_team` (slug, nombre, rol); enlaza `user_id` por los correos de `PLAN_Q4_EMAILS` (`ale:correo,soshil:correo`) cuando el usuario existe. Nunca borra un enlace ya hecho.
3. Guarda la Parte 2 en `plan_content`.
4. Tareas con `id` nuevo → insert completo. Existentes con `origen = 'plan'` → solo actualiza `titulo`. Nunca toca estado, responsable, apoyo, fecha ni nota, y no borra tareas.
5. Imprime cuántas insertó, cuántos títulos cambió, los choques con tareas del panel y las tareas de la base que no están en el archivo.

## Reglas (lógica pura, con tests)

- `weekStart(fecha)`: lunes de la semana; "hoy" en hora CR.
- Única **vencida**: `estado ≠ hecho` y `fecha < hoy`. **De esta semana**: `fecha` entre el lunes y el domingo actuales.
- Semanal **activa** en la semana actual: `fecha ≤ domingo`. Su check es la fila `plan_task_weeks(task_id, lunes)`.
- **Pendientes** (contador de pestaña): únicas no hechas + semanales activas sin check esta semana, del filtro de persona.
- **Siguiente id** del bloque: `B8-` + (máximo existente + 1), dos dígitos mínimo.
- Filtro de persona por responsable. Al delegar a quien era el apoyo, el apoyo se limpia.
- `?tab` o `?persona` inválidos → Resumen y la persona por defecto.

## Pantalla (`/plan-q4`)

- Server component: lee tareas, checks de la semana actual, `plan_team` y `plan_content` (parseado).
- **Filtro** Todos · Ale · Soshil · Alina. Por defecto el usuario logueado (o Todos si no está en el equipo). En la URL: `?tab=b8&persona=alina`.
- **Pestañas** Resumen, B0…B12, Decisiones, con distintivo Lectura/Acción y contador de pendientes en las de acción. En pantallas anchas, lista vertical a la izquierda del contenido; en angostas, un `<select>`.
- **Lectura:** Contexto renderizado.
- **Acción:** tareas arriba (únicas abiertas por fecha, luego semanales, hechas al final), Contexto abajo en sección colapsable abierta, y "Nueva tarea".
- **Fila de tarea:** check rápido (única: hecho ↔ pendiente; semanal: check de esta semana), título, id, responsable (y apoyo), fecha (roja si vencida, resaltada si es de esta semana; semanales "Semanal desde …"), estado en curso, nota, "Ale · 13 oct, 14:05". Al tocarla se abre la edición: estado, responsable, apoyo, fecha, nota.
- **Resumen:** encabezado fijo; "Esta semana" por persona (vencidas, de esta semana, semanales activas); "Avance por bloque" (hechas/total de únicas); "Próximo hito" y días que faltan.
- Estilo: tokens del admin (`#060607`, `#0c0c0f`, bordes `white/[0.06]`, acento `#5bb6ff`, rojo `red-300` como Tareas). Toda la interfaz en español. Las tablas anchas se desplazan dentro de su caja, no la página.

## APIs (todas con `requireApiPermission('can_view_plan')` + usuario en `plan_team`)

- `POST /api/plan-q4/tasks` `{ bloque, titulo, responsable, apoyo?, fecha, tipo }` → id siguiente del bloque, `origen = 'panel'` (reintenta una vez si choca la PK).
- `PATCH /api/plan-q4/tasks/[id]` `{ estado?, responsable?, apoyo?, fecha?, nota? }` → fija `actualizado_por/en`. `estado` solo en únicas.
- `PUT /api/plan-q4/tasks/[id]/weeks` `{ week_start, done }` → upsert del check (solo semanales, lunes, no antes del inicio).

Validación pura (como Tareas) con mensajes en español.

## Verificación

- `node --test`: parser (fixture sintético), fechas CR, reglas, validación, diff del seed.
- `npm run plan:seed -- --dry-run` contra el archivo real: 15 pestañas, 71 tareas, sin errores.
- `tsc`, `next build`.
- Preview de Vercel con sesión: cambiar estado, reasignar, nota, check semanal, crear tarea, link directo a pestaña, 375 px.

## Paso a producción

1. Migración (Management API). 2. `PLAN_Q4_EMAILS` en `.env.local` y `npm run plan:seed`. 3. Encender `can_view_plan` a Ale y Soshil. 4. PR → preview → merge. 5. Crear a Alina en `/usuarios`, agregar su correo a `PLAN_Q4_EMAILS` y volver a correr el seed.

## Fuera de alcance

Borrar tareas, editar el título de tareas existentes, historial de cambios (solo el último), correos o notificaciones.
