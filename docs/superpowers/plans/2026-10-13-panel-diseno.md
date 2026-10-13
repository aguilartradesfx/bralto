# Diseño del admin igual al del sitio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El panel interno y el login con el sistema visual del sitio (liquid glass monocromo, versión de trabajo), sin cian.

**Architecture:** Los tokens del tema oscuro del sitio salen de `home.css` a `components/home/tokens.css`, compartido por `.hm` (sitio) y `.pn` (panel). `components/internal/panel.css` define el fondo del panel y seis clases (`pn-glass`, `pn-solid`, `pn-btn-solid`, `pn-btn-glass`, `pn-chip-on`, `pn-signal`). Los layouts del panel y del login envuelven en `.pn` con Sora y JetBrains Mono. Un test recorre los archivos del panel y falla si queda el estilo viejo; después se barren los archivos con la tabla de equivalencias del spec.

**Tech Stack:** Next.js 15, Tailwind 3.4, CSS global, `next/font` (Sora, JetBrains Mono), `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-13-panel-diseno-design.md`

## Global Constraints

- El sitio público no cambia: mismos valores de tokens en `.hm`.
- `pn-glass` usa `backdrop-filter`: **nunca** en un contenedor que tenga adentro un modal `fixed` (el modal quedaría atrapado en la caja). Solo en el menú, la barra móvil, el cajón móvil, los paneles de los modales, la tarjeta del login, las tarjetas de Inicio y las del Resumen del Plan Q4.
- `components/contracts/signature-pad.tsx` no se toca (lo usa la firma pública `/c/`).
- Textos sin cambios (voseo, sentence case). Íconos Lucide con `strokeWidth={1.5}` y `absoluteStrokeWidth` donde se toquen.
- Sin dependencias nuevas.

## Review Focus

- Un modal (borrar contrato, firmar como Bralto, editar usuario) abierto dentro de una página con vidrio → tiene que cubrir toda la pantalla, no quedar dentro de una tarjeta.
- Teléfono a 375 px: menú en barra superior + cajón, sin scroll horizontal en ninguna pantalla.
- Sitio público después de mover los tokens → `--bg`, `--ink`, `--glass-tint`, `--blur` calculados en `.hm` iguales a antes, incluido el tema claro y el `--blur` móvil.
- Foco con teclado → anillo naranja visible en botones y links; en campos de texto, el borde blanco (sin doble anillo).
- Login → mismo vidrio y fuentes que el panel.

---

### Task 1: Tokens compartidos

**Files:** Create `components/home/tokens.css` · Modify `components/home/home.css:13-105`, `components/home/shell.tsx:1`

- [ ] **Step 1:** Mover a `components/home/tokens.css` el bloque `/* ---------- Tokens ---------- */` de `home.css` (desde `.hm {` con `--accent` hasta el cierre del bloque `.hm[data-theme='light']`), sin cambiar valores, con estos selectores:
  - bloque base (`--accent`, curvas, radios, `--maxw`, `--gutter`, `--blur`, `--nav-h`, fuentes): `.hm,\n.pn {`
  - tema oscuro: `.hm,\n.hm[data-theme='dark'],\n.pn {`
  - tema claro: `.hm[data-theme='light'] {` (igual que antes)
  Encabezado: `/* Tokens del sistema liquid glass: sitio (.hm) y panel interno (.pn). El tema claro es solo del sitio. */`
- [ ] **Step 2:** En `home.css`, en lugar del bloque: `/* Tokens: components/home/tokens.css (compartidos con el panel) */`.
- [ ] **Step 3:** `components/home/shell.tsx`: `import './tokens.css'` antes de `import './home.css'`.
- [ ] **Step 4:** `npx tsc --noEmit` y `npm test` → limpios.
- [ ] **Step 5: Commit** — `refactor(sitio): tokens del liquid glass en un archivo compartido`

### Task 2: Base del panel (CSS, fuentes, layouts, test de guarda)

**Files:** Create `components/internal/panel.css`, `lib/panel-style.test.ts` · Modify `components/home/fonts.ts`, `app/(internal)/layout.tsx`, `app/(auth)/layout.tsx`, `tailwind.config.ts`, `app/globals.css` (sacar `.plan-md` / `.plan-table`)

- [ ] **Step 1: Test que falla** — `lib/panel-style.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Archivos del panel (admin.bralto.io) y del login. signature-pad.tsx también lo usa la firma pública (/c/).
const ROOTS = ['app/(internal)', 'app/(auth)', 'components/internal', 'components/users', 'components/contracts', 'components/proposals', 'components/plan-q4']
const EXCLUDE = new Set(['components/contracts/signature-pad.tsx'])
const OLD_STYLE = /5bb6ff|7cc5ff|\bcyan\b|#0c0c0f|#131316|#111111|#060607|91\s*,?\s*182\s*,?\s*255/i

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return walk(path)
    return /\.(tsx?|css)$/.test(name) ? [path] : []
  })
}

test('el panel no usa el cian ni las superficies del estilo viejo', () => {
  const offenders = ROOTS.flatMap(walk)
    .filter((file) => !EXCLUDE.has(file))
    .flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, i) => (OLD_STYLE.test(line) ? [`${file}:${i + 1}: ${line.trim().slice(0, 90)}`] : [])),
    )
  assert.deepEqual(offenders, [])
})

test('el panel y el login usan los tokens, las fuentes y el fondo del sitio', () => {
  for (const file of ['app/(internal)/layout.tsx', 'app/(auth)/layout.tsx']) {
    const source = readFileSync(file, 'utf8')
    assert.match(source, /className="pn[\s"]/, file)
    assert.match(source, /panelFonts/, file)
    assert.match(source, /tokens\.css/, file)
    assert.match(source, /panel\.css/, file)
  }
})
```

- [ ] **Step 2:** `npm test` → FAIL en los dos tests (lista de archivos con cian; layouts sin `pn`).
- [ ] **Step 3:** `components/home/fonts.ts`: actualizar el comentario de Sora ("El sitio y el panel interno usan estas fuentes; la firma de contratos sigue con Geist.") y agregar al final:

```ts
// Variables de fuente del panel interno y el login (components/internal/panel.css)
export const panelFonts = `${sora.variable} ${jetbrainsMono.variable}`
```

- [ ] **Step 4:** `components/internal/panel.css` (incluye el `.plan-md` / `.plan-table` que se saca de `globals.css`, con el cian cambiado a blanco):

```css
/* Panel interno (admin.bralto.io) y login: el sistema liquid glass del sitio en versión de trabajo.
   Tokens en components/home/tokens.css. Solo tema oscuro. */

:root:has(.pn) body {
  background-color: #050505;
}

.pn {
  /* font-sans y font-mono de Tailwind apuntan a Geist: dentro del panel, a las fuentes del sitio */
  --font-geist: var(--font-sora);
  --font-geist-mono: var(--font-jbmono);
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-display);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Fondo: brillo fijo (sin orbes animados) y el grano del sitio */
.pn::before,
.pn::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.pn::before {
  background:
    radial-gradient(70vmax 45vmax at 88% -12%, var(--orb-1), transparent 70%),
    radial-gradient(55vmax 40vmax at -12% 108%, var(--orb-2), transparent 70%);
  opacity: .55;
}

.pn::after {
  opacity: var(--grain);
  mix-blend-mode: var(--grain-blend);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 220px 220px;
}

.pn :focus-visible {
  outline: 2px solid var(--accent-ink);
  outline-offset: 2px;
}

/* Los campos marcan el foco con su borde */
.pn :is(input, select, textarea):focus-visible {
  outline: none;
}

/* Vidrio ahumado. Con backdrop-filter: nunca en un contenedor que tenga adentro un modal fixed */
.pn-glass {
  position: relative;
  background: var(--glass-sheen), var(--glass-tint);
  -webkit-backdrop-filter: blur(var(--blur)) saturate(165%);
  backdrop-filter: blur(var(--blur)) saturate(165%);
  box-shadow:
    inset 0 1px 0 var(--glass-hi),
    inset 0 -1px 0 var(--glass-lo),
    inset 0 0 0 1px var(--glass-edge),
    var(--glass-shadow);
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .pn-glass {
    background: var(--glass-sheen), var(--solid);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .pn-glass {
    background: var(--glass-sheen), var(--solid);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

@media (max-width: 639px) {
  .pn {
    --blur: 18px;
  }
}

/* Superficie sólida: listas, tablas y desplegables */
.pn-solid {
  background: var(--solid);
  box-shadow: inset 0 0 0 1px var(--rule);
}

/* Botón principal: blanco con degradado, como el del sitio */
.pn-btn-solid {
  background: var(--btn-bg);
  color: var(--btn-ink);
  border-radius: var(--r-pill);
  box-shadow: inset 0 1px 0 var(--btn-hi), inset 0 -1px 0 var(--btn-lo), 0 10px 24px -12px var(--btn-shadow);
  transition: transform .3s var(--ease), box-shadow .3s var(--ease), opacity .2s;
}

.pn-btn-solid:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: inset 0 1px 0 var(--btn-hi), inset 0 -1px 0 var(--btn-lo), 0 16px 30px -14px var(--btn-shadow);
}

.pn-btn-solid:active:not(:disabled) {
  transform: scale(.98);
  transition-duration: .12s;
}

/* Botón secundario: vidrio interno */
.pn-btn-glass {
  background: var(--inset-fill);
  color: var(--ink);
  border-radius: var(--r-pill);
  box-shadow: inset 0 1px 0 var(--inset-hi), inset 0 0 0 1px var(--inset-edge);
  transition: box-shadow .2s, opacity .2s;
}

.pn-btn-glass:hover:not(:disabled) {
  box-shadow: inset 0 1px 0 var(--inset-hi), inset 0 0 0 1px var(--rule-2);
}

/* Activo: chips, filtros, pestañas e ítem del menú */
.pn-chip-on {
  background: var(--inset-fill);
  color: var(--ink);
  box-shadow: inset 0 1px 0 var(--inset-hi), inset 0 0 0 1px var(--inset-edge);
}

/* La señal: el único naranja (ítem activo del menú) */
.pn-signal {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 999px;
  background: var(--accent);
  box-shadow: 0 0 10px rgba(255, 109, 40, .6);
}
```

…seguido del bloque `.plan-md` / `.plan-table` cortado de `globals.css`, con `.plan-md a { color: #fff; … }` y `.plan-md blockquote { border-left: 2px solid rgba(255, 255, 255, .25); background: rgba(255, 255, 255, .04); … }`.

- [ ] **Step 5:** `tailwind.config.ts` → `colors`, agregar:

```ts
        // Tokens del sistema del sitio (components/home/tokens.css), para el panel (.pn)
        ink: { DEFAULT: 'var(--ink)', 2: 'var(--ink-2)', 3: 'var(--ink-3)' },
        rule: { DEFAULT: 'var(--rule)', 2: 'var(--rule-2)' },
        solid: 'var(--solid)',
```

- [ ] **Step 6:** `app/(internal)/layout.tsx`:

```tsx
import '@/components/home/tokens.css'
import '@/components/internal/panel.css'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Document } from '@/components/document'
import { panelFonts } from '@/components/home/fonts'
import { InternalNav } from '@/components/internal/internal-nav'
import { getCurrentSession } from '@/lib/panel-session'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')

  return (
    <Document lang="es" fonts={panelFonts}>
      <div className="pn text-white">
        <InternalNav profile={profile} />
        <main className="pt-14 md:pt-0 md:pl-[248px] min-h-screen">{children}</main>
      </div>
    </Document>
  )
}
```

`app/(auth)/layout.tsx`: mismos imports de CSS y `panelFonts`; `return <Document lang="es" fonts={panelFonts}><div className="pn">{children}</div></Document>`.

- [ ] **Step 7:** `npm test` → el test de layouts pasa; el de cian sigue fallando (se cierra en Task 6). `npx tsc --noEmit` limpio.
- [ ] **Step 8: Commit** — `feat(panel): base del sistema del sitio (tokens, fondo, fuentes y piezas)`

### Task 3: Menú, login e Inicio

**Files:** Modify `components/internal/internal-nav.tsx`, `app/(auth)/login/page.tsx`, `app/(internal)/admin/page.tsx`

- [ ] **Step 1: Menú.**
  - Escritorio: `<aside className="hidden md:flex fixed left-3 top-3 bottom-3 w-56 pn-glass rounded-[20px] flex-col z-40">`.
  - Barra móvil: `pn-glass` en lugar de `bg-[#0c0c0f] border-b border-white/[0.06]`.
  - Cajón móvil: `pn-glass rounded-r-[20px]` en lugar de `bg-[#0c0c0f] border-r border-white/[0.06]`.
  - "interno": `font-mono text-white/40 text-[10px] uppercase tracking-widest`.
  - Ítem activo: `pn-chip-on text-white` y `<span className="pn-signal ml-auto" aria-hidden />` al final. Inactivo: `text-white/55 hover:text-white hover:bg-white/[0.05]`. Ítems `rounded-xl`.
  - Íconos con `strokeWidth={1.5} absoluteStrokeWidth`.
- [ ] **Step 2: Login.**
  - Contenedor: `min-h-screen flex items-center justify-center p-4`, sin el fondo ni el degradado cian.
  - Tarjeta: `pn-glass rounded-[28px] p-6`.
  - Campos: aplicar la tabla de focos del spec.
  - Botón: `pn-btn-solid w-full font-semibold px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed`.
- [ ] **Step 3: Inicio.**
  - Tarjetas: `pn-glass group flex flex-col gap-3 p-5 rounded-[20px] transition-transform hover:-translate-y-0.5`.
  - Caja del ícono: `bg-white/[0.06]`, con el ícono en `text-white/80`.
  - Flecha: `group-hover:text-white`.
- [ ] **Step 4:** `npx tsc --noEmit` limpio. **Commit** — `feat(panel): menú, login e inicio con el sistema del sitio`

### Task 4: Contratos y clientes

**Files:**
- `app/(internal)/contratos/page.tsx`, `contratos/[id]/page.tsx`, `contratos/[id]/editar/page.tsx`, `contratos/nuevo/page.tsx` y `clientes/page.tsx`.
- `components/contracts/*` salvo `signature-pad.tsx`.

- [ ] **Step 1:** Aplicar la tabla de equivalencias del spec en cada archivo.
  - Paneles de modales (`delete-button.tsx`, `bralto-sign-button.tsx`): `pn-glass rounded-[24px]` sobre su overlay `fixed inset-0 bg-black/70`.
  - Desplegables (`client-selector.tsx`): `pn-solid`.
  - La hoja blanca del contrato no se toca.
- [ ] **Step 2:** `npx tsc --noEmit` limpio y `npm test`: ningún archivo de estas rutas en la lista del test de guarda. **Commit** — `feat(panel): contratos y clientes con el sistema del sitio`

### Task 5: Solicitudes, propuestas y usuarios

**Files:** `app/(internal)/propuestas/page.tsx`, `app/(internal)/solicitudes/**`, `components/proposals/*`, `components/users/user-management.tsx`

- [ ] **Step 1:** Igual que Task 4. Modales de `user-management.tsx` y `solicitudes-dashboard.tsx`: `pn-glass rounded-[24px]`. Chips o filtros activos: `pn-chip-on`.
- [ ] **Step 2:** tsc limpio; ninguno de estos archivos en el test de guarda. **Commit** — `feat(panel): solicitudes, propuestas y usuarios con el sistema del sitio`

### Task 6: Plan Q4

**Files:** `components/plan-q4/*`, `app/(internal)/plan-q4/page.tsx`

- [ ] **Step 1:**
  - Filtro de persona y pestañas activas: `pn-chip-on text-white`. La pestaña activa del menú del plan lleva `pn-signal`.
  - Distintivo "Acción": `bg-white/[0.08] text-white border-white/15`.
  - Botones: `pn-btn-solid` y `pn-btn-glass`; "Nueva tarea", `text-white hover:text-white/70`.
  - Barras de avance: `bg-white/80`.
  - Tarjetas del Resumen: `pn-glass rounded-[20px]` (no contienen modales).
  - Campos: `bg-solid` y focos de la tabla.
- [ ] **Step 2:** `npm test` → **los dos tests de guarda pasan**; 248 + 2 en total. tsc limpio. **Commit** — `feat(panel): plan q4 con el sistema del sitio`

### Task 7: Verificación

- [ ] `npm test`, `npx tsc --noEmit`, `npm run build` limpios.
- [ ] Sitio en local (`/es`): `getComputedStyle(.hm)` de `--bg`, `--ink`, `--glass-tint`, `--blur` y `--btn-bg` igual que en producción (www.bralto.io), en escritorio y a 375 px; captura de la portada.
- [ ] Panel con sesión (con el permiso de Alejandro, porque toca la base): capturas de login, Inicio, Contratos (lista y detalle), Clientes, Solicitudes, Propuestas, Usuarios y Plan Q4, en escritorio y a 375 px.
  - Ninguna pantalla con scroll horizontal.
  - Un modal abierto cubre toda la pantalla.
  - El foco con teclado se ve.
- [ ] Revisión final de la rama → PR → preview → merge con el OK de Alejandro.
