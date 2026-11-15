# Oficina de Knox — Fase 1 y modo dormir · Plan de trabajo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La Oficina de Knox con datos reales en admin.bralto.io/oficina y como vista del centro en knox.bralto.io: tres vistas en pixel art, panel, ficha, el reloj de marcar alimentado por las tareas que ya corren, y el switch para dormir toda la oficina y despertarla donde quedó.

**Architecture:**
- Tres tablas en Supabase con RLS cerrada (solo service role): el catálogo de agentes, las marcas y el estado de la oficina.
- Funciones puras en `lib/oficina/` calculan estados, números, «Para ti», «Lo próximo», la reprogramación al despertar y las rutas de la oficina. Están probadas con `node --test`.
- Las rutas `app/api/oficina/*` con `is_admin` sirven la foto del momento cada 15 s y cambian el modo dormir.
- Un envoltorio marca las tareas programadas del sitio, y un comando `marcar` marca las del servidor.
- El dibujo es el prototipo pasado a TypeScript (canvas 2D, sin librerías) dentro de un componente React.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase (`@supabase/supabase-js`), `node:test`, canvas 2D, date-fns 4.

**Spec:** `docs/superpowers/specs/2026-11-15-oficina-knox-design.md` (y el prototipo en `docs/superpowers/specs/2026-11-15-oficina-prototipo/`).

## Global Constraints

- **El repo es público.** El catálogo (nombres, oficios, personalidades, horarios y aspecto) se siembra desde `~/Documents/Bralto-redes/oficina/agentes.json`, que queda fuera del repo. En el repo van el motor, los tipos y las frases genéricas.
- Las tablas nuevas llevan `enable row level security` y `revoke all … from anon, authenticated`, como `20261111_015_redes_analisis.sql`. Se leen solo desde el servidor después de `requireApiPermission('is_admin')` o de `hasPermission(profile, 'is_admin')`.
- **Pixeles:** el arte se dibuja a 1× y se amplía en canvas con `imageSmoothingEnabled = false`. Nunca `image-rendering` de CSS.
- Textos en español de Costa Rica, con tuteo y sin «pana». Que se entiendan sin saber de tecnología.
- La Oficina no publica, no aprueba y no borra nada. Solo lee, abre enlaces y cambia el modo dormir.
- **Horas:** los horarios del catálogo son cron de 5 campos en UTC, como en `vercel.json` y en el crontab del servidor. En pantalla se muestran en hora de Costa Rica (UTC−6, sin horario de verano), con el formato `7:30 p. m.`.
- **Pruebas:** `npm test` (`node --test "lib/**/*.test.ts"`). Los imports internos van con extensión `.ts`.
- **Estados de un agente:** `trabajando`, `publicando`, `listo`, `fallo`, `descansando`, `pedido`, `pendiente`, `a-medias` y `durmiendo`.
- **Modo dormir:** Echo («Comenta») sigue despierto (`despierto_siempre`). Lo atrasado al despertar no sale de noche:
  - posts normales entre 10:00 y 20:00;
  - pruebas entre 8:00 y 22:00.

## Review Focus

1. **Una corrida que se murió sin `termina`:** pasado el doble de `dura_min` se ve `a-medias`, nunca `trabajando` para siempre. Su prueba va en la Tarea 3.
2. **Lo que se publicaba mientras la oficina dormía:** nunca cae de noche ni se pierde por la regla de las 3 h. Si dos caen en la misma hora, se separan 30 min. Su prueba va en la Tarea 6.
3. **Tareas de cada 5 minutos que no hicieron nada:** no crean filas ni chat. Mientras la oficina duerme dejan una sola `saltada` por hora y no 12. Su prueba va en la Tarea 7.
4. **Catálogo vacío, base caída o marcas de un agente que no está en el catálogo:** la página muestra «Todavía no hay datos» y no se cae. Las marcas huérfanas se ignoran. Su prueba va en la Tarea 3.
5. **Probar el switch en la vista previa no puede dormir producción.** La fila del estado sale de `OFICINA_ESTADO_ID`, que vale `1` en producción y `2` en la vista previa. Su prueba va en la Tarea 4.

## Archivos

| Archivo | Para qué |
|---|---|
| `supabase/migrations/20261115_016_oficina.sql` | Tablas `oficina_agentes`, `oficina_marcas` y `oficina_estado`, y la vista `oficina_numeros` |
| `lib/oficina/tipos.ts` | Tipos compartidos |
| `lib/oficina/horario.ts` (+ test) | `siguienteCorrida` (cron UTC) y `horaCR` |
| `lib/oficina/estado.ts` (+ test) | `estadoDe`, `numerosDe`, `paraTi` y `proximos` |
| `lib/oficina/servidor.ts` (+ test) | Leer y escribir en Supabase, y `idEstado()` |
| `lib/oficina/despertar.ts` (+ test) | `reprogramar` (puro) y `despertar` (servidor) |
| `lib/oficina/envoltorio.ts` (+ test) | `conOficina` y `conOficinaCon` |
| `lib/oficina/cli.ts` (+ test) | `leerArgs` y `validarAgentes` |
| `lib/oficina/mundo.ts` (+ test) | Plano, grilla y rutas A* (del prototipo `loft-mundo.js`) |
| `lib/oficina/frases-sueno.ts` (+ test) | Frases genéricas de cuando duermen |
| `scripts/oficina/marcar.ts`, `scripts/oficina/sembrar.ts` | Comandos para el servidor y para sembrar el catálogo |
| `app/api/oficina/route.ts`, `app/api/oficina/dormir/route.ts` | Foto del momento y switch |
| `components/oficina/pixel/{arte,knox-sprite,vista,plano}.ts` | Dibujo (del prototipo) |
| `components/oficina/oficina.tsx`, `components/oficina/oficina.css` | La página: pestañas, panel, línea del día, ficha y switch |
| `app/(internal)/oficina/page.tsx` | admin.bralto.io/oficina |
| Las 9 rutas de `app/api/cron/*`, `lib/crm/bandeja/servidor.ts` y `app/api/zernio/webhook/route.ts` | Marcar |
| `lib/host-routing.ts`, `lib/panel-access.ts`, `lib/panel/navegacion.ts`, `components/internal/shell/iconos.tsx` | Sección nueva del panel |
| `lib/knox/centro/vistas/tipos.ts`, `components/knox-centro/paneles.tsx`, `components/knox-centro/centro.tsx` | Vista «Oficina» en el centro |
| Fuera del repo: `~/Documents/Bralto-redes/servidor/{correr-noche.sh,tarea-noche.md,oficina-vigia.sh}` y `~/Documents/Bralto-redes/oficina/agentes.json` | El servidor y el catálogo |

---

### Task 1: Tablas y tipos

**Files:**
- Create: `supabase/migrations/20261115_016_oficina.sql`
- Create: `lib/oficina/tipos.ts`

**Interfaces:**
- Produces:
  - `Agente`: `{ id, nombre, oficio, area, puesto: number, aspecto: Aspecto, personalidad, frase, horario: string | null, cada_minutos: number | null, ruta: string | null, donde: 'servidor' | 'sitio' | 'zernio' | 'asistente' | 'mano', estado_fijo: 'pendiente' | 'pedido' | null, despierto_siempre: boolean, dura_min: number, ultima_revision: string | null }`
  - `Aspecto`: `{ tela, ropa, pantalon?, orejas?, cabeza?, gorro?, extra?, glifo }`
  - `TipoMarca = 'empieza' | 'termina' | 'falla' | 'pasa' | 'entrega' | 'publica' | 'saltada'`
  - `Marca`: `{ id, agente, tipo: TipoMarca, para: string | null, texto, enlace: string | null, ref_tabla: string | null, ref_id: string | null, dura_seg: number | null, extra: Record<string, unknown> | null, visto_en: string | null, creado_en: string }`
  - `NuevaMarca`: lo mismo que `Marca`, sin `id`, sin `visto_en` y sin `creado_en`, y con todos los opcionales en opcional.
  - `EstadoOficina`: `{ dormida: boolean, desde: string | null, por: string | null }`
  - `EstadoAgente`: la unión de la sección Global Constraints.
  - `Numeros`: `{ tareas: number, horas: number, diasSinFallar: number }`
  - `Proximo`: `{ cuando: string, agente: string, texto: string }`
  - `Snapshot`: `{ ahora: string, oficina: EstadoOficina, agentes: (Agente & { estado: EstadoAgente, numeros: Numeros })[], marcas: Marca[], paraTi: Marca[], proximos: Proximo[] }`

- [ ] **Step 1: Escribir la migración.** Columnas exactas:
```sql
create table public.oficina_agentes (
  id text primary key, nombre text not null, oficio text not null, area text not null, puesto int not null,
  aspecto jsonb not null default '{}'::jsonb, personalidad text not null default '', frase text not null default '',
  horario text, cada_minutos int, ruta text,
  donde text not null check (donde in ('servidor','sitio','zernio','asistente','mano')),
  estado_fijo text check (estado_fijo in ('pendiente','pedido')), despierto_siempre boolean not null default false,
  dura_min int not null default 10, ultima_revision timestamptz, activo boolean not null default true);
create table public.oficina_marcas (
  id uuid primary key default gen_random_uuid(), agente text not null references public.oficina_agentes(id),
  tipo text not null check (tipo in ('empieza','termina','falla','pasa','entrega','publica','saltada')),
  para text, texto text not null, enlace text, ref_tabla text, ref_id text, dura_seg int, extra jsonb,
  visto_en timestamptz, creado_en timestamptz not null default now());
create index oficina_marcas_creado on public.oficina_marcas (creado_en desc);
create index oficina_marcas_agente on public.oficina_marcas (agente, creado_en desc);
create table public.oficina_estado (id int primary key, dormida boolean not null default false, desde timestamptz, por text, actualizado_en timestamptz not null default now());
insert into public.oficina_estado (id) values (1), (2);
create view public.oficina_numeros as select agente,
  count(*) filter (where tipo = 'termina') as tareas, coalesce(sum(dura_seg) filter (where tipo = 'termina'), 0) as segundos,
  max(creado_en) filter (where tipo = 'falla') as ultima_falla, min(creado_en) as primera
  from public.oficina_marcas group by agente;
```
Termina con `enable row level security` y `revoke all … from anon, authenticated` para las 3 tablas, y `revoke all` en la vista.

- [ ] **Step 2: Aplicarla en Supabase** con la API de administración (`POST /v1/projects/<ref>/database/query`, usando `SUPABASE_ACCESS_TOKEN` de `.env.local`), igual que las anteriores. Verificar que `select id, dormida from oficina_estado order by id` devuelve `1 false` y `2 false`.
- [ ] **Step 3: Escribir `lib/oficina/tipos.ts`** con los tipos del bloque Interfaces. Correr `npx tsc --noEmit -p .`: no da errores nuevos.
- [ ] **Step 4: Commit** `feat(oficina): tablas del reloj de marcar, catálogo y estado`.

### Task 2: Horarios

**Files:** Create `lib/oficina/horario.ts` y `lib/oficina/horario.test.ts`

**Interfaces:**
- Produces:
  - `siguienteCorrida(expr: string, desde: Date): Date | null`: cron de 5 campos en UTC con `*`, `*/n`, `a-b` y `a,b`. El día de la semana es 0–6, con domingo = 0. Busca minuto a minuto a partir del minuto siguiente, con un tope de 8 días. Si la expresión no se entiende, devuelve `null`.
  - `horaCR(fecha: Date): string`: `'7:30 p. m.'`, `'10:00 a. m.'`, `'12:40 a. m.'`.

- [ ] **Step 1: Escribir las pruebas que fallan.**
```ts
test('la noche: 0 1 * * * desde el 15/11 a las 20:00 UTC', () =>
  assert.equal(siguienteCorrida('0 1 * * *', new Date('2026-11-15T20:00:00Z'))?.toISOString(), '2026-11-16T01:00:00.000Z'))
test('cada 6 h al minuto 40', () =>
  assert.equal(siguienteCorrida('40 */6 * * *', new Date('2026-11-15T07:00:00Z'))?.toISOString(), '2026-11-15T12:40:00.000Z'))
test('domingo 15:00 UTC desde un lunes', () =>
  assert.equal(siguienteCorrida('0 15 * * 0', new Date('2026-11-16T10:00:00Z'))?.toISOString(), '2026-11-22T15:00:00.000Z'))
test('cada 5 min salta al siguiente múltiplo', () =>
  assert.equal(siguienteCorrida('*/5 * * * *', new Date('2026-11-15T20:02:10Z'))?.toISOString(), '2026-11-15T20:05:00.000Z'))
test('mal escrita → null', () => assert.equal(siguienteCorrida('cada rato', new Date()), null))
test('hora de Costa Rica', () => {
  assert.equal(horaCR(new Date('2026-11-16T01:30:00Z')), '7:30 p. m.')
  assert.equal(horaCR(new Date('2026-11-15T16:00:00Z')), '10:00 a. m.')
  assert.equal(horaCR(new Date('2026-11-15T06:40:00Z')), '12:40 a. m.')
})
```
- [ ] **Step 2:** `npm test`: falla porque no existe el módulo.
- [ ] **Step 3: Implementar las dos funciones.** Sin librerías. `horaCR` resta 6 h y escribe la hora en formato de 12 horas.
- [ ] **Step 4:** `npm test`: pasa.
- [ ] **Step 5: Commit** `feat(oficina): próxima corrida de un horario y hora de Costa Rica`.

### Task 3: Estados, números, «Para ti» y «Lo próximo»

**Files:** Create `lib/oficina/estado.ts` y `lib/oficina/estado.test.ts`

**Interfaces:**
- Consumes: los tipos de la Task 1, más `siguienteCorrida` y `horaCR` de la Task 2.
- Produces:
  - `estadoDe(a: Agente, marcas: Marca[], ahora: Date, oficina: EstadoOficina, pendientes: Marca[]): EstadoAgente`. `marcas` son las de las últimas 24 h de ese agente, de la más nueva a la más vieja. `pendientes` son las de `paraTi`.
  - `numerosDe(fila: { tareas: number, segundos: number, ultima_falla: string | null, primera: string | null } | undefined, ahora: Date): Numeros`
  - `paraTi(entregas: Marca[], resueltas: Set<string>, ahora: Date): Marca[]`. La clave de `resueltas` es `` `${ref_tabla}:${ref_id}` ``.
  - `proximos(agentes: Agente[], pubs: { id: string, titulo: string, publicar_en: string, prueba: boolean }[], ahora: Date, n?: number): Proximo[]`

**Reglas de `estadoDe`, en este orden:**
1. Si la oficina duerme y el agente no es `despierto_siempre`: `durmiendo`.
2. Si `estado_fijo` es `pendiente`: `pendiente`.
3. Si la última marca es `empieza`: `a-medias` cuando lleva más de `2 × dura_min`; si no, `trabajando`.
4. Una `publica` de hace menos de 10 min: `publicando`.
5. Una `falla` más nueva que su último `termina`: `fallo`.
6. Si tiene una entrega en `pendientes`: `listo`.
7. Si `estado_fijo` es `pedido`: `pedido`.
8. Si no: `descansando`.

**`proximos`:**
- Deja fuera a los agentes con `cada_minutos <= 15`, con `estado_fijo` o sin `horario`.
- Suma las publicaciones futuras como `Zap · «<titulo>»` (o `Vero · prueba de «<titulo>»` si es prueba).
- Ordena por hora y devuelve las primeras `n = 5`. `cuando` va con `horaCR`.

- [ ] **Step 1: Escribir las pruebas que fallan.** Lo que tienen que comprobar:
  - Un `empieza` de hace 25 min con `dura_min = 10` da `a-medias`; uno de hace 15 min da `trabajando`.
  - `durmiendo` gana a todo, salvo a `despierto_siempre`, que sigue con su estado.
  - Una `falla` después de un `termina` da `fallo`; un `termina` después de una `falla` da `descansando`.
  - `paraTi` deja fuera las entregas vistas, las resueltas y las que no apuntan a nada y tienen más de 24 h; se queda con las de 23 h.
  - `numerosDe(undefined, ahora)` da `{ tareas: 0, horas: 0, diasSinFallar: 0 }`; con `segundos: 5400` da `horas: 1.5`.
  - `proximos` no incluye un agente con `cada_minutos: 5` y sí la noche (`0 1 * * *`) con `cuando: '7:00 p. m.'`.
  - Una marca de un agente que no está en el catálogo no rompe nada (Review Focus 4).
- [ ] **Step 2:** `npm test`: falla.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4:** `npm test`: pasa.
- [ ] **Step 5: Commit** `feat(oficina): estados, números, «Para ti» y «Lo próximo»`.

### Task 4: Servidor de la Oficina

**Files:** Create `lib/oficina/servidor.ts` y `lib/oficina/servidor.test.ts`

**Interfaces:**
- Consumes: `createServiceClient()` de `lib/supabase/service.ts` y las Tasks 1–3.
- Produces:
  - `idEstado(env?: NodeJS.ProcessEnv): number`. Lee `OFICINA_ESTADO_ID`; si no es 1 ni 2, devuelve 1.
  - `leerOficina(ahora: Date): Promise<Snapshot>`. Lee los agentes activos, las marcas de las últimas 24 h, `oficina_numeros`, el estado de la fila `idEstado()` y las publicaciones de `redes_publicaciones` con `estado = 'programado'` desde ahora. Una entrega con `ref_tabla = 'redes_publicaciones'` queda resuelta si esa fila ya está `publicado`, `borrador` o `cancelado`. Si la base falla, devuelve el `Snapshot` vacío con `agentes: []`.
  - `marcar(m: NuevaMarca): Promise<void>`. Nunca lanza un error: lo deja en `console.error('[oficina]', …)`.
  - `revisado(agente: string): Promise<void>`
  - `estadoOficina(): Promise<EstadoOficina>`, con caché de 20 s en memoria.
  - `ponerDormida(dormida: boolean, por: string): Promise<EstadoOficina>`
  - `ultimaSaltada(agente: string): Promise<Date | null>`

- [ ] **Step 1: Prueba de `idEstado`.** `{ OFICINA_ESTADO_ID: '2' }` da 2; `{}` da 1; `'99'` da 1.
- [ ] **Step 2:** `npm test`: falla.
- [ ] **Step 3: Implementar.** Usa la misma forma de leer y los mismos mensajes de error que `lib/ideas/servidor.ts`.
- [ ] **Step 4:** `npm test`: pasa. `npx tsc --noEmit -p .` sin errores nuevos.
- [ ] **Step 5: Commit** `feat(oficina): leer la oficina, marcar y el estado de dormir`.

### Task 5: Rutas de la Oficina

**Files:** Create `app/api/oficina/route.ts` y `app/api/oficina/dormir/route.ts`

**Interfaces:**
- Consumes: `requireApiPermission` de `lib/panel-session.ts`, `leerOficina` y `ponerDormida` de la Task 4, y `despertar` de la Task 6.
- Produces:
  - `GET /api/oficina` → `Snapshot` (`Cache-Control: no-store`). Sin permiso, 403, igual que las demás. Si falla, 500 con `{ error: 'No se pudo leer la oficina. Prueba de nuevo en un rato.' }`.
  - `POST /api/oficina/dormir` con cuerpo `{ dormida: boolean }` → `EstadoOficina`. Si cambia de dormida a despierta, corre `despertar(desdeAnterior, new Date())` dentro de `after()`. Un cuerpo inválido da 400.

- [ ] **Step 1: Implementar las dos rutas** con el patrón de `app/api/knox/centro/vista/[nombre]/route.ts` (`runtime = 'nodejs'` y `dynamic = 'force-dynamic'`).
- [ ] **Step 2:** `npm run build` pasa. Con `npm run dev` y sin sesión, `curl -s localhost:3000/api/oficina` no devuelve datos.
- [ ] **Step 3: Commit** `feat(oficina): rutas para leer la oficina y dormirla`.

### Task 6: Despertar y retomar

**Files:** Create `lib/oficina/despertar.ts` y `lib/oficina/despertar.test.ts`

**Interfaces:**
- Consumes: `marcar` de la Task 4. `oficina_agentes.ruta` guarda la dirección de cada tarea programada, por ejemplo `/api/cron/knox`.
- Produces:
  - `reprogramar(pubs: { id: string, publicar_en: string, prueba: boolean }[], desde: Date, ahora: Date): { id: string, publicar_en: string }[]`. Toma solo las publicaciones con `publicar_en` entre `desde` y `ahora`, y las corre hacia adelante lo que duró la siesta (`ahora − desde`). Si la hora nueva cae fuera de su ventana en hora de Costa Rica (posts de 10:00 a 20:00, pruebas de 8:00 a 22:00), pasa al inicio de la siguiente ventana. Dos que caen en la misma hora se separan 30 min y conservan su orden.
  - `despertar(desde: Date, ahora: Date): Promise<string>`. Pasos:
    1. Reprograma en `redes_publicaciones` las publicaciones `programado` de ese tramo.
    2. Llama una vez y en orden, con `Authorization: Bearer ${CRON_SECRET}`, la `ruta` de cada agente que tenga una marca `saltada` desde `desde`.
    3. Marca `{ agente: 'drax', tipo: 'pasa', para: 'todos', texto: 'Despertamos, a seguir donde quedamos' }`.
    4. Devuelve un resumen.

- [ ] **Step 1: Escribir las pruebas que fallan** (horas en UTC; Costa Rica = UTC−6):
  - Post de las 18:00 CR, dormidos de 17:00 a 23:00 CR: queda al otro día a las 10:00 CR.
  - Prueba de las 21:00 CR, dormidos de 20:30 a 21:30 CR: la hora nueva (22:00) cae fuera, así que queda al otro día a las 8:00 CR.
  - Dos posts que caen a las 10:00 CR: el segundo queda a las 10:30.
  - Un post programado antes de `desde` no se toca.
- [ ] **Step 2:** `npm test`: falla.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4:** `npm test`: pasa.
- [ ] **Step 5: Commit** `feat(oficina): al despertar, mover lo atrasado y correr lo que se saltó`.

### Task 7: Marcar desde las tareas del sitio, los DM y el «Comenta»

**Files:**
- Create: `lib/oficina/envoltorio.ts` y `lib/oficina/envoltorio.test.ts`
- Modify: `app/api/cron/{publicar,ideas,payments-reconcile,pruebas,pruebas-resumen,analisis,knox,knox-arranques,contract-reminders}/route.ts`, `lib/crm/bandeja/servidor.ts` (`procesarWebhook`) y `app/api/zernio/webhook/route.ts`

**Interfaces:**
- Consumes: `marcar`, `revisado`, `estadoOficina` y `ultimaSaltada` de la Task 4.
- Produces:
  - `type Resultado = { hizo: boolean, resumen: string, detalle?: unknown }`
  - `conOficinaCon(deps: { dormida(agente: string): Promise<boolean>, marcar(m: NuevaMarca): Promise<void>, revisado(a: string): Promise<void>, ultimaSaltada(a: string): Promise<Date | null>, ahora(): number }, agente: string, trabajo: () => Promise<Resultado>): Promise<Resultado | { salto: 'dormida' }>`
  - `conOficina(agente, trabajo)`: lo mismo, con las dependencias reales. `dormida(agente)` es falso para quien tiene `despierto_siempre`.
  - `textoEcho(n: number): string`: `'Le mandó la guía a 1 persona'` o `'Le mandó la guía a 12 personas'`.

**Comportamiento:**
- **Dormida:** no llama a `trabajo` y marca `saltada` («Me la salté porque la oficina estaba durmiendo»), salvo que la última `saltada` sea de hace menos de 60 min.
- **`hizo: false`:** solo llama a `revisado`.
- **`hizo: true`:** marca `termina` con el `resumen` y `dura_seg`.
- **Si lanza un error:** marca `falla` con `"Falló: <mensaje en una línea>"` y vuelve a lanzarlo.

- [ ] **Step 1: Escribir las pruebas que fallan** de `conOficinaCon`, una por rama:
  - dormida: no se llama a `trabajo` y hay una sola `saltada` aunque se llame 3 veces en una hora;
  - `hizo: false`: cero marcas y se llama a `revisado`;
  - `hizo: true`: `termina` con `dura_seg`;
  - error: `falla` y el error se vuelve a lanzar.

  También `textoEcho(1)` y `textoEcho(12)`.
- [ ] **Step 2:** `npm test`: falla.
- [ ] **Step 3: Implementar el envoltorio.**
- [ ] **Step 4: Envolver las 9 rutas.**
  - Dentro del `try` de cada una: `const r = await conOficina('<id>', async () => { const x = await <lo de hoy>; return { hizo: <regla>, resumen: <frase>, detalle: x } })`. Se responde con `r`.
  - Los ids son: publicar→`zap`, ideas→`nova`, payments-reconcile→`kash`, pruebas→`vero`, pruebas-resumen→`krono`, analisis→`quark`, knox→`knox`, knox-arranques→`luma` y contract-reminders→`inko`.
  - `hizo` sale del resultado que ya devuelve cada ruta: hay al menos una cosa hecha (publicada, analizada, enviada…).
  - El `resumen` es una frase corta de lo que hizo, por ejemplo «Publicó 1 post y agendó 1 en TikTok».
  - Donde `publicar` agenda en TikTok, se marca además `{ agente: 'tiko', tipo: 'termina', texto: 'Agendó «<titulo>» en TikTok' }`.
  - Cuando una publicación sale, se marca `{ agente: 'zap', tipo: 'publica', texto: 'Publicó «<titulo>»' }`.
- [ ] **Step 5: Dex y Echo.**
  - En `procesarWebhook`: si `await estadoOficina()` da `dormida`, `knox` queda en `null` (el contestador se calla). Cuando `atenderMensaje` termina, `marcar({ agente: 'dex', tipo: 'termina', texto: 'Escribió la respuesta a un DM' })`.
  - En el webhook de Zernio: con `evento === 'comment.received'`, dentro de `after()`, se suma 1 a la marca `termina` de `echo` de la hora actual. Se guarda `extra.cuenta` y `texto = textoEcho(cuenta)`; si esa marca no existe, se crea.
- [ ] **Step 6:** `npm test` y `npm run build` pasan.
- [ ] **Step 7: Commit** `feat(oficina): las tareas del sitio, los DM y el «Comenta» marcan su trabajo`.

### Task 8: Comandos `marcar` y `sembrar`

**Files:**
- Create: `lib/oficina/cli.ts`, `lib/oficina/cli.test.ts`, `scripts/oficina/marcar.ts` y `scripts/oficina/sembrar.ts`
- Modify: `package.json` (`"oficina:marcar"` y `"oficina:sembrar"`, con el mismo estilo que `crm:importar`)

**Interfaces:**
- Produces:
  - `leerArgs(argv: string[]): { orden: 'estado' } | { orden: 'marcar', marca: NuevaMarca } | { error: string }`. Forma: `<agente> <tipo> "<texto>" [--para x] [--enlace url] [--ref tabla:id] [--dura seg]`.
  - `validarAgentes(json: unknown): { ok: Agente[] } | { error: string }`. Exige `id`, `nombre`, `oficio`, `area`, `puesto` y un `donde` válido.
- Uso en el servidor: `node --env-file=.env.local scripts/oficina/marcar.ts estado` imprime `dormida` o `despierta`, y sale con código **3** si está dormida.

- [ ] **Step 1: Escribir las pruebas que fallan.**
  - `leerArgs(['drax','pasa','Te paso 2 reels','--para','plexi'])` da la marca con `para: 'plexi'`.
  - `--ref redes_publicaciones:abc` llena `ref_tabla` y `ref_id`.
  - Un tipo que no existe da `{ error }`.
  - `validarAgentes` rechaza un `donde` inválido.
- [ ] **Step 2:** `npm test`: falla.
- [ ] **Step 3: Implementar** `cli.ts` y los dos scripts. Usan `createServiceClient` y, en `sembrar`, `upsert` por `id`.
- [ ] **Step 4:** `npm test` pasa. `npm run oficina:marcar -- estado` imprime `despierta`.
- [ ] **Step 5: Commit** `feat(oficina): comandos para marcar desde el servidor y sembrar el catálogo`.

### Task 9: El mundo, las rutas y el dibujo en TypeScript

**Files:**
- Create: `lib/oficina/mundo.ts`, `lib/oficina/mundo.test.ts`, `lib/oficina/frases-sueno.ts`, `lib/oficina/frases-sueno.test.ts` y `components/oficina/pixel/{arte,knox-sprite,vista,plano}.ts`
- Fuente: el prototipo en `docs/superpowers/specs/2026-11-15-oficina-prototipo/` (`loft-mundo.js`, `loft-arte.js`, `knox-sprite.js`, `loft-vista.js`, `plano-pixel.js`). Se pasa a TypeScript sin cambiar medidas ni colores.

**Interfaces:**
- Produces:
  - `crearMundo(agentes: { id: string, puesto: number }[]): Mundo`, con `Mundo = { W: 906, H: 476, salas: Sala[], libre(x: number, y: number): boolean, ruta(a: [number, number], b: [number, number]): [number, number][], asiento(id: string): [number, number], visita(id: string): [number, number], PARA_TI: [number, number] }`. `puesto` 0–23 decide la oficina: fila = ⌊puesto/6⌋ y columna = puesto % 6.
  - `FRASES_SUENO: string[]`: al menos 20, por ejemplo «¿Por qué nos habremos ido a dormir?», «Estoy molido, mae» o «Soñé que era un pixel».
  - `crearVista(cv: HTMLCanvasElement, mundo: Mundo, agentes: AgenteVista[], op: { alTocar(id: string | null): void, alAvisar(t: string): void }): { estados(m: Record<string, EstadoAgente>): void, visita(de: string, a: string, dice: string, responde?: string): void, dormir(si: boolean): void, decir(id: string, texto: string): void, medir(): void, acercar(): void, alejar(): void, verTodo(): void, destruir(): void }`. `AgenteVista` es `Agente` con `aspecto`. `dormir(true)` baja las luces, duerme a todos (menos a los `despierto_siempre`) y frena los paseos.
  - `crearPlano(cv, agentes, textoDe: (id: string) => string, alTocar)` con `medir()` y `destruir()`.

- [ ] **Step 1: Escribir las pruebas que fallan** de `mundo.ts`:
  - De `asiento('drax')` (puesto 0) a `visita` del puesto 1, cada tramo de la ruta pasa solo por celdas `libre`, revisando cada 2 px.
  - Del puesto 0 al puesto 12 (otro pasillo), algún punto de la ruta tiene `x < 30` (usa el pasillo izquierdo).
  - Las frases de sueño no contienen «pana», «tarea», «post», «reel», «cliente» ni «publicar».
- [ ] **Step 2:** `npm test`: falla.
- [ ] **Step 3: Pasar el prototipo.**
  - `vista.ts` ya no corre un guion de ejemplo: solo anima lo que le piden con `visita` y `decir`.
  - Se pausa con `document.hidden`.
  - `destruir()` quita los eventos y el `requestAnimationFrame`.
- [ ] **Step 4:** `npm test` pasa y `npx tsc --noEmit -p .` no da errores nuevos.
- [ ] **Step 5: Commit** `feat(oficina): el mundo, las rutas y el dibujo en pixel art`.

### Task 10: El componente de la Oficina

**Files:** Create `components/oficina/oficina.tsx` y `components/oficina/oficina.css`

**Interfaces:**
- Consumes: `Snapshot` (Task 1), `GET /api/oficina` y `POST /api/oficina/dormir` (Task 5), `crearMundo`, `FRASES_SUENO`, `crearVista` y `crearPlano` (Task 9), y `horaCR` (Task 2).
- Produces: `export function Oficina(p: { inicial: Snapshot | null }): JSX.Element`, un componente `'use client'`. Con `inicial = null` pide los datos al montarse.

**Qué hace**
- Igual que el prototipo `loft.html` + `pagina.js`, pero con datos reales:
  - las cuentas por estado;
  - las pestañas Maqueta, Plano y Maqueta y día (la última que eligió se guarda en `localStorage`, dentro de try/catch);
  - el panel con Ahora, Para ti (el botón «Ver» abre el `enlace`), Falló y Lo próximo;
  - la línea del día, armada con las marcas de hoy por área;
  - la ficha (foto pixel, números, personalidad, frase, lo último que hizo y lo próximo).
- Pide `/api/oficina` cada 15 s y para mientras `document.hidden`.
- **Las marcas nuevas desde la última consulta:**
  - `pasa` → `vista.visita(de, para, texto)`;
  - `entrega` → `vista.visita(de, 'ale', texto)` y un aviso «<Nombre> te dejó algo en tu oficina: <texto>».
- **El switch** «A dormir» / «Despertar» va en la cabecera:
  - pide confirmación dentro de la misma página (nunca `window.confirm`) con estos textos: «¿Dormimos la oficina? Nadie empieza nada nuevo hasta que la despiertes.» y «¿Despertamos la oficina? Retoman donde quedaron.»;
  - mientras duerme muestra el letrero «La oficina duerme desde las <horaCR(desde)>.»;
  - cada 25–45 s, un Knox dormido dice una frase de `FRASES_SUENO` con `vista.decir`.
- **Sin agentes** (base caída o catálogo vacío): una tarjeta «Todavía no hay datos. Apenas los agentes empiecen a anotar, aparecen aquí.»
- Estilos: los del prototipo (Silkscreen para la letra pixel). En el panel no se usa el cian, por la prueba de estilos del panel.

- [ ] **Step 1: Implementar el componente y su CSS.**
- [ ] **Step 2:** `npm run build` pasa.
- [ ] **Step 3: Commit** `feat(oficina): la página con las tres vistas, el panel, la ficha y el switch de dormir`.

### Task 11: Sección «Oficina» en admin.bralto.io

**Files:**
- Create: `app/(internal)/oficina/page.tsx`
- Modify: `lib/host-routing.ts` (`'/oficina'` en `PANEL_PREFIXES`), `lib/panel-access.ts` (`['/oficina', 'is_admin']`), `lib/panel/navegacion.ts` (`IconoNav` suma `'oficina'`; el ítem `{ href: '/oficina', label: 'Oficina', icono: 'oficina' }` va junto a Ideas y Análisis) y `components/internal/shell/iconos.tsx` (el ícono de Lucide `Building2`)
- Test: las pruebas que ya existen en `lib/host-routing.test.ts`, `lib/panel-access.test.ts` y `lib/panel/navegacion.test.ts`

**Interfaces:**
- Consumes: `leerOficina` (Task 4) y `Oficina` (Task 10). El patrón de la página es el de `app/(internal)/ideas/page.tsx`: `getCurrentSession`, `hasPermission(profile, 'is_admin')` y `redirect`.

- [ ] **Step 1: Agregar a las pruebas existentes:**
  - `/oficina` es ruta del panel;
  - pide `is_admin`;
  - el menú de un admin la incluye y el de alguien sin `is_admin`, no.
- [ ] **Step 2:** `npm test`: falla.
- [ ] **Step 3: Hacer los cambios y la página** (`metadata.title = 'Oficina'`, `<Oficina inicial={await leerOficina(new Date())} />`).
- [ ] **Step 4:** `npm test` y `npm run build` pasan.
- [ ] **Step 5: Commit** `feat(oficina): la Oficina en el panel de admin`.

### Task 12: Vista «Oficina» en el centro de Knox

**Files:** Modify `lib/knox/centro/vistas/tipos.ts`, `components/knox-centro/paneles.tsx` (`PESTANAS`) y `components/knox-centro/centro.tsx`

**Interfaces:**
- `VISTAS` suma `'oficina'`.
- `VistaConDatos = Exclude<Vista, 'hoy' | 'oficina'>`, y `esVistaConDatos` devuelve falso para `'oficina'`.
- `PESTANAS` suma `['oficina', 'Oficina']`.
- En `centro.tsx`:
  - `VISTA_INFO` pasa a ser `Record<Exclude<Vista, 'hoy'>, …>`, con `oficina: { titulo: 'Oficina', sub: 'Quién trabaja, qué te dejaron y qué sigue', enlace: { texto: 'Abrir en el panel', href: 'https://admin.bralto.io/oficina' } }`;
  - el efecto que pide datos no corre en `'oficina'`;
  - dentro de `MarcoVista` va `{vista === 'oficina' && <Oficina inicial={null} />}`.

- [ ] **Step 1: Escribir la prueba que falla** junto a las de `lib/knox/centro/vistas`: `esVista('oficina')` es `true`, `esVistaConDatos('oficina')` es `false` y `leerVista('oficina')` es `'oficina'`.
- [ ] **Step 2:** `npm test`: falla.
- [ ] **Step 3: Hacer los cambios.**
- [ ] **Step 4:** `npm test` y `npm run build` pasan. En `npm run dev`, `/knox?vista=oficina` muestra la Oficina dentro del marco del centro.
- [ ] **Step 5: Commit** `feat(oficina): la Oficina como vista del centro de Knox`.

### Task 13: El servidor marca y respeta el modo dormir (fuera del repo)

**Files:** en el servidor (`ssh -i ~/.ssh/bralto_vps knox@<servidor>`), dentro de `~/Documents/Bralto-redes/servidor/`: Modify `correr-noche.sh` y `tarea-noche.md`; Create `oficina-vigia.sh` y su línea de crontab. Primero se actualiza el clon del sitio en el servidor a esta rama, o a `main` después del merge, para que exista `scripts/oficina/marcar.ts`.

**Interfaces:**
- Consumes: `marcar.ts estado` (sale con código 3 si la oficina duerme) y `marcar.ts <agente> <tipo> "<texto>"` (Task 8).

**Cambios:**
- **`correr-noche.sh`:**
  - Al empezar: si `estado` da 3, marca `drax saltada "Me salté la noche porque la oficina estaba durmiendo"` y sale con código 0.
  - Si no, marca `drax empieza "Empiezo la noche"`.
  - Al final: `drax termina "Terminé la noche" --dura <seg>` o `drax falla "La noche se cortó"`.
- **`tarea-noche.md`:** cada agente de pieza marca su propio `empieza` y `termina` con su nombre: los reels son `plexi` y los posts, `pixa`. Además:
  - el coordinador marca `drax pasa … --para plexi|pixa` al repartir;
  - la pieza marca `plexi|pixa pasa … --para lynx` al pedir revisión;
  - el coordinador marca `lynx pasa … --para zap` al aprobar y programar;
  - y `zap entrega "Vista previa de «<titulo>»" --ref redes_publicaciones:<id>` al mandar la vista previa.
  - Frases de una línea, en tico y sin datos de clientes.
- **`oficina-vigia.sh`** (crontab `* * * * *`, con `flock -n logs/.vigia`):
  - si la oficina duerme y la noche está corriendo (el candado `logs/.candado` está tomado): manda `SIGTERM` al grupo de procesos de la noche, deja el archivo `logs/.cortada-por-dormir` y marca `drax saltada "Me dormí a media noche; sigo al despertar"`;
  - si está despierta y existe `logs/.cortada-por-dormir`: lo borra y lanza `correr-noche.sh` en segundo plano. Las rondas de «retoma» no rehacen lo que ya está programado.

- [ ] **Step 1: Respaldar los dos archivos** (`.antes-oficina`).
- [ ] **Step 2: Hacer los cambios.** `bash -n` sin errores en los dos `.sh`.
- [ ] **Step 3: Probar el vigía sin dormir producción.** Con `OFICINA_ESTADO_ID=2` en el entorno del vigía: dormir la fila 2 desde la vista previa, correr `oficina-vigia.sh --simular` (solo imprime lo que haría) y despertarla.
- [ ] **Step 4: Ver la noche en simulación.** `correr-noche.sh --simular` muestra los `marcar` que haría.
- [ ] **Step 5: Anotar en `servidor/LEEME`** qué hace el vigía y cómo apagarlo.

### Task 14: Sembrar el catálogo, probar en vivo y abrir el PR

**Files:** Create `~/Documents/Bralto-redes/oficina/agentes.json` (fuera del repo)

- [ ] **Step 1: Escribir el JSON** con los 24 agentes, sacados de la tabla de la sección «Decisiones mías» del diseño y del aspecto de `loft-equipo.js` del prototipo:
  - el `horario` y el `cada_minutos` salen de `vercel.json` y del crontab del servidor;
  - `ruta` es la de su tarea en `app/api/cron`;
  - `estado_fijo` es `pendiente` para Atlas, Volt y Ping, y `pedido` para Mira, Remix, Clip y Quip;
  - `despierto_siempre` va solo en Echo;
  - `dura_min`: la noche 240, el resto 10.
- [ ] **Step 2: Sembrar.** `npm run oficina:sembrar -- ~/Documents/Bralto-redes/oficina/agentes.json`, y comprobar con `select count(*) from oficina_agentes` que da 24.
- [ ] **Step 3: Subir la rama y abrir el PR** (descripción sin datos internos). Esperar la vista previa de Vercel y ponerle `OFICINA_ESTADO_ID=2` en Preview.
- [ ] **Step 4: Probar en la vista previa.**
  - `/oficina` muestra los 24 con estados reales.
  - Al marcar `drax pasa "Prueba" --para plexi` desde la compu, Drax camina a la oficina de Plexi en menos de 20 s.
  - El switch duerme y despierta la fila 2 sin tocar producción.
  - En el teléfono se ve nítido y el panel queda abajo.
- [ ] **Step 5: Merge** con el OK de Alejandro. Después, en producción, la Oficina se llena sola con lo que corre ese día.

## Self-review

- **Cobertura del diseño:**
  - Vistas, panel, ficha y zoom: Tasks 9–10.
  - Dos dominios: Tasks 11–12.
  - Marcas y quién anota: Tasks 4, 7, 8 y 13.
  - Estados, `a-medias`, `pendiente`, «Para ti» que se resuelve solo y «Lo próximo» sin las de 5 min: Task 3.
  - Modo dormir: Tasks 4–7, 10 y 13.
  - Catálogo fuera del repo: Tasks 8 y 14.
  - El chat queda para la Fase 2. En esta fase solo hay las frases de sueño y las nubes de las visitas.
- **Nombres consistentes:** `leerOficina`, `marcar`, `estadoOficina`, `ponerDormida`, `despertar`, `conOficina`, `crearMundo`, `crearVista` y `FRASES_SUENO` se usan igual en todas las tareas.
