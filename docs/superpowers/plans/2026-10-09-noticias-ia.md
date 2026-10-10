# Noticias de IA automáticas: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** publicar sola una nota diaria de IA en `/es/noticias` y `/en/noticias`, con imagen firmada, desde un flujo de n8n que corre a las 6:00 de Costa Rica.

**Architecture:**
- n8n hace el trabajo: feeds, elección, redacción, revisión, traducción, imagen y avisos con Resend.
- El sitio tiene cuatro endpoints:
  - `recientes`: lo ya publicado, para descartar repetidas;
  - `validar`: revisa las reglas de la nota sin guardar nada;
  - `noticias`: compone la portada con la firma, la sube a Supabase Storage y guarda la fila;
  - `estado`: publica u oculta desde el correo.
- Las páginas se arman en cada visita con la clave anónima y RLS, así que ocultar una nota es inmediato.

**Tech Stack:** Next.js 15.5 App Router, next-intl, Supabase (Postgres + Storage), zod 4, sharp + satori (portada), `node --test` con TS nativo (Node 24), n8n por MCP, API de Gemini (`gemini-3.1-pro-preview`, `gemini-3-pro-image`) y Resend.

**Spec:** `docs/superpowers/specs/2026-10-09-noticias-ia-design.md`

## Global Constraints

- **Reglas de la nota:**
  - Cuerpo en español: 400–600 palabras. Cuerpo en inglés: 340–690.
  - Título: hasta 110 caracteres. Resumen: 80–200 caracteres.
- **Nada copiado:** ninguna secuencia de 8 palabras seguidas igual a la fuente, tras normalizar a minúsculas y quitar acentos y puntuación. Aplica al título, resumen y cuerpo, en los dos idiomas.
- **Términos prohibidos** en todos los campos: GoHighLevel, Go High Level, HighLevel, GHL. "high-level" no cuenta.
- **Formato del cuerpo:** párrafos separados por una línea en blanco y subtítulos `## `. Sin HTML, links, listas, `*` ni `` ` ``.
- **Estados:** `estado` ∈ {`publicada`, `oculta`}. Publicar desde el correo pone `publicada_en = now()`.
- **Rutas:** `/{es|en}/noticias` y `/{es|en}/noticias/{slug}`. El slug es el mismo en los dos idiomas y sale del título en español.
- **Textos visibles:**
  - Mayúscula solo al inicio (sentence case), también en inglés.
  - Trato de "usted" en español.
  - Nunca "GoHighLevel".
- **Firma de la portada:** "Alejandro Aguilar · CEO Bralto", en Sora 500, pequeña, abajo a la derecha. La portada es un JPEG de 1600×900.
- **Avisos:** a `aguilartradesfx@gmail.com`, desde `Bralto Noticias <noticias@send.bralto.io>`, con Resend.
- **Aviso de IA:**
  - ES: "Redactada con apoyo de inteligencia artificial a partir de la fuente citada."
  - EN: "Written with the help of artificial intelligence, based on the cited source."
- **Pruebas:** los módulos de `lib/news/` con prueba solo pueden importar valores de paquetes (`zod`, `sharp`, `satori`, `node:*`). Entre hermanos, solo `import type`. Así lo exige `node --test` con extensiones `.ts`.
- **Antes de cada commit:** `git checkout tsconfig.tsbuildinfo` (tsc lo modifica).

## Review Focus

1. **Una fuente con poco texto** (OpenAI responde 403, solo hay resumen). La validación tiene que rechazar `fuente_texto` con menos de 150 palabras; si no, el control de frases copiadas no sirve. Prueba en la tarea 2.
2. **Títulos con signos raros o con `<`** en la página de confirmación del correo. Se escapan; si no, quedaría HTML inyectado. Prueba en la tarea 3 (`escapeHtml`).
3. **Dos notas que dan el mismo slug.** Se agrega el sufijo `-2`, `-3`… Prueba en la tarea 3 (`uniqueSlug`).
4. **Un token del correo reutilizado para otra acción u otra nota.** Se rechaza. Prueba en la tarea 3 (`verifyNewsToken`).
5. **Imagen en PNG o con prefijo `data:`**, que llega del fallback de 1K. Se acepta y sale igual en JPEG de 1600×900. Pruebas en las tareas 3 (`decodeImage`) y 4 (`composeCover` con PNG de 1376×768).

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `supabase/migrations/20261009_001_noticias.sql` | Tabla, índice, trigger, RLS y bucket |
| `lib/news/types.ts` | Tipos compartidos (solo tipos) |
| `lib/news/rules.ts` (+test) | Reglas de la nota: palabras, formato, prohibidos, copiado |
| `lib/news/body.ts` (+test) | Cuerpo → bloques `h2` / `p` para pintar |
| `lib/news/slug.ts` (+test) | `slugify`, `uniqueSlug` |
| `lib/news/links.ts` (+test) | Tokens HMAC de los links del correo y `escapeHtml` |
| `lib/news/payload.ts` (+test) | Forma de los pedidos (zod) y `decodeImage` |
| `lib/news/cover.ts` (+test) | Portada: recorte 1600×900 + firma + JPEG |
| `lib/news/fonts/sora-500.woff`, `OFL.txt` | Fuente de la firma |
| `lib/news/store.ts` | Lecturas y escrituras en Supabase (sin prueba unitaria; se prueba en integración) |
| `lib/news/api-key.ts` | Chequeo del header `x-api-key` |
| `app/api/noticias/route.ts` | POST publicar |
| `app/api/noticias/validar/route.ts` | POST validar |
| `app/api/noticias/recientes/route.ts` | GET usados + títulos recientes |
| `app/api/noticias/estado/route.ts` | GET confirmación, POST aplicar |
| `app/[locale]/noticias/page.tsx` | Listado |
| `app/[locale]/noticias/[slug]/page.tsx` | Nota (y vista previa) |
| `components/news/news-list.tsx`, `news-article.tsx`, `news.css`, `format.ts` | Interfaz |
| `components/seo/JsonLd.tsx` | `NewsArticleJsonLd` |
| `components/home/home-nav.tsx`, `shell.tsx`, `home-footer.tsx` | Enlace "Noticias" |
| `messages/es.json`, `messages/en.json` | `Home.nav.links.noticias` y namespace `News` |
| `app/sitemap.ts` | `/noticias` + notas publicadas |
| `next.config.ts` | `remotePatterns` de Supabase y `outputFileTracingIncludes` de la fuente |
| `n8n/noticias-ia-diarias.js`, `n8n/noticias-ia-errores.js` | Código SDK de los workflows (fuente de verdad para `update_workflow`) |

---

### Task 1: Base de datos y almacenamiento

**Files:**
- Create: `supabase/migrations/20261009_001_noticias.sql`

- [ ] **Step 1: Escribir la migración**

```sql
-- Noticias de IA: una nota diaria publicada sola desde n8n (docs/superpowers/specs/2026-10-09-noticias-ia-design.md)
create table if not exists public.noticias (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo_es text not null,
  resumen_es text not null,
  cuerpo_es text not null,
  imagen_alt_es text not null,
  titulo_en text not null,
  resumen_en text not null,
  cuerpo_en text not null,
  imagen_alt_en text not null,
  fuente_url text not null unique,
  fuente_nombre text not null,
  imagen_url text not null,
  publicada_en timestamptz not null default now(),
  estado text not null default 'publicada' check (estado in ('publicada', 'oculta')),
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

create index if not exists noticias_estado_fecha_idx on public.noticias (estado, publicada_en desc);

create or replace function public.noticias_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizada_en = now();
  return new;
end
$$;

drop trigger if exists noticias_touch on public.noticias;
create trigger noticias_touch before update on public.noticias
  for each row execute function public.noticias_touch();

-- El público solo ve lo publicado; escribe solo la service role (el sitio)
alter table public.noticias enable row level security;
drop policy if exists "noticias publicadas visibles" on public.noticias;
create policy "noticias publicadas visibles" on public.noticias
  for select to anon, authenticated using (estado = 'publicada');

-- Portadas: públicas, solo JPEG, hasta 5 MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('noticias', 'noticias', true, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
```

- [ ] **Step 2: Aplicarla en Supabase**

Con `pg` en el scratchpad, por el pooler `aws-1-us-east-1.pooler.supabase.com:5432`, user `postgres.pjwmfllnyauobityaile`, `SUPABASE_DB_PASSWORD` de `.env.local` y `ssl:{rejectUnauthorized:false}`. El script lee el archivo SQL y lo ejecuta en una transacción.

Expected: sin error. Después, `select count(*) from public.noticias` da 0 y `select public from storage.buckets where id='noticias'` da `true`.

- [ ] **Step 3: Verificar RLS con la clave anónima**

Insertar con `pg` dos filas de prueba, una `publicada` y una `oculta`. Después:

`curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/noticias?select=slug" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"`

Expected: solo aparece el slug de la publicada. Después borrar las dos filas.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20261009_001_noticias.sql
git commit -m "feat(noticias): tabla, RLS y bucket de portadas"
```

---

### Task 2: Reglas de la nota

**Files:**
- Create: `lib/news/types.ts`, `lib/news/rules.ts`, `lib/news/rules.test.ts`

**Interfaces:**
- Produces:
  - `NewsDraft = { titulo, resumen, cuerpo, imagen_alt }` (todos string);
  - `NewsLocale = 'es' | 'en'`, `NewsStatus`, `NewsAction = 'ver' | 'publicar' | 'ocultar'`, `NewsRow`;
  - `SourceContext = { fuente_url, fuente_nombre, fuente_texto }`;
  - `countWords(text): number`;
  - `findBannedTerms(text): string[]`;
  - `copiedPhrases(text, source, run = 8): string[]`;
  - `bodyFormatProblems(body): string[]`;
  - `validateDraft(draft, locale, source): string[]` (los problemas en español, con el prefijo `[es]` o `[en]`).

- [ ] **Step 1: Tipos**

```ts
// lib/news/types.ts
export type NewsLocale = 'es' | 'en'
export type NewsStatus = 'publicada' | 'oculta'
export type NewsAction = 'ver' | 'publicar' | 'ocultar'

// Lo que escribe Gemini en un idioma
export type NewsDraft = {
  titulo: string
  resumen: string
  cuerpo: string
  imagen_alt: string
}

// La fuente de la nota; fuente_texto solo sirve para revisar que nada esté copiado
export type SourceContext = {
  fuente_url: string
  fuente_nombre: string
  fuente_texto: string
}

export type NewsRow = {
  id: string
  slug: string
  titulo_es: string
  resumen_es: string
  cuerpo_es: string
  imagen_alt_es: string
  titulo_en: string
  resumen_en: string
  cuerpo_en: string
  imagen_alt_en: string
  fuente_url: string
  fuente_nombre: string
  imagen_url: string
  publicada_en: string
  estado: NewsStatus
  actualizada_en: string
}
```

- [ ] **Step 2: Escribir las pruebas (fallan)**

```ts
// lib/news/rules.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bodyFormatProblems, copiedPhrases, countWords, findBannedTerms, validateDraft } from './rules.ts'
import type { NewsDraft, SourceContext } from './types.ts'

const words = (n: number, w = 'palabra') => Array.from({ length: n }, (_, i) => `${w}${i}`).join(' ')
// Cuerpo válido: 3 párrafos y un subtítulo, n palabras en total sin contar el "##"
const body = (n: number) => `${words(n - 3 - 100, 'a')}\n\n## Por qué importa\n\n${words(50, 'b')}\n\n${words(50, 'c')}`
const source: SourceContext = {
  fuente_url: 'https://openai.com/index/algo',
  fuente_nombre: 'OpenAI',
  fuente_texto: words(300, 'fuente'),
}
const draft = (over: Partial<NewsDraft> = {}): NewsDraft => ({
  titulo: 'OpenAI lanza una función nueva para negocios',
  resumen: 'Qué cambia para las empresas que usan herramientas de IA en sus ventas y su atención, y por dónde empezar a aprovecharlo.',
  cuerpo: body(480),
  imagen_alt: 'Una consola de vidrio iluminada en naranja sobre fondo oscuro',
  ...over,
})

test('countWords cuenta palabras y números, no signos ni el ## de los subtítulos', () => {
  assert.equal(countWords('## Por qué importa\n\nHola, mundo: 3 veces — sí.'), 8)
})

test('una nota válida no tiene problemas', () => {
  assert.deepEqual(validateDraft(draft(), 'es', source), [])
})

test('el cuerpo en español tiene que tener entre 400 y 600 palabras', () => {
  assert.match(validateDraft(draft({ cuerpo: body(399) }), 'es', source).join('\n'), /\[es\].*399 palabras/)
  assert.match(validateDraft(draft({ cuerpo: body(601) }), 'es', source).join('\n'), /601 palabras/)
  assert.deepEqual(validateDraft(draft({ cuerpo: body(400) }), 'es', source), [])
  assert.deepEqual(validateDraft(draft({ cuerpo: body(600) }), 'es', source), [])
})

test('en inglés el rango es 340 a 690', () => {
  assert.deepEqual(validateDraft(draft({ cuerpo: body(345) }), 'en', source), [])
  assert.match(validateDraft(draft({ cuerpo: body(339) }), 'en', source).join('\n'), /\[en\]/)
})

test('título hasta 110 caracteres y resumen de 80 a 200', () => {
  assert.match(validateDraft(draft({ titulo: 'x'.repeat(111) }), 'es', source).join(), /título/)
  assert.match(validateDraft(draft({ resumen: 'corto' }), 'es', source).join(), /resumen/)
  assert.match(validateDraft(draft({ resumen: 'x'.repeat(201) }), 'es', source).join(), /resumen/)
  assert.match(validateDraft(draft({ imagen_alt: ' ' }), 'es', source).join(), /texto alternativo/)
})

test('GoHighLevel no aparece en ninguna forma; "high-level" sí se permite', () => {
  for (const t of ['GoHighLevel', 'Go High Level', 'go-high-level', 'HighLevel', 'el CRM GHL']) {
    assert.notDeepEqual(findBannedTerms(t), [], t)
  }
  assert.deepEqual(findBannedTerms('a high-level overview and a high level plan'), [])
  assert.match(validateDraft(draft({ resumen: draft().resumen.replace('herramientas', 'GoHighLevel') }), 'es', source).join(), /GoHighLevel/i)
})

test('copiedPhrases encuentra 8 palabras seguidas iguales, sin importar acentos, mayúsculas ni puntuación', () => {
  const src = 'La empresa anunció hoy que su nuevo modelo responde más rápido que nunca.'
  assert.deepEqual(copiedPhrases('Según dicen, la empresa anuncio HOY que su nuevo modelo responde, y punto.', src), [
    'la empresa anuncio hoy que su nuevo modelo responde',
  ])
  assert.deepEqual(copiedPhrases('La empresa anunció hoy que su modelo es rápido.', src), [])
})

test('una nota con una frase copiada de la fuente no pasa', () => {
  const copied = 'fuente10 fuente11 fuente12 fuente13 fuente14 fuente15 fuente16 fuente17'
  const problems = validateDraft(draft({ cuerpo: `${copied} ${body(480)}` }), 'es', source)
  assert.match(problems.join('\n'), /copiad/)
})

test('si la fuente llegó casi vacía no se puede revisar el copiado: no pasa', () => {
  assert.match(validateDraft(draft(), 'es', { ...source, fuente_texto: words(149) }).join(), /fuente/)
})

test('la fuente necesita link https y nombre', () => {
  assert.match(validateDraft(draft(), 'es', { ...source, fuente_url: 'http://x.com/a' }).join(), /link/)
  assert.match(validateDraft(draft(), 'es', { ...source, fuente_url: 'no es un link' }).join(), /link/)
  assert.match(validateDraft(draft(), 'es', { ...source, fuente_nombre: '' }).join(), /nombre de la fuente/)
})

test('el cuerpo no lleva HTML, links, listas, negritas ni otros títulos', () => {
  assert.match(bodyFormatProblems('Hola <b>mundo</b>').join(), /HTML/)
  assert.match(bodyFormatProblems('Vea https://x.com').join(), /links/)
  assert.match(bodyFormatProblems('Vea [esto](x)').join(), /links/)
  assert.match(bodyFormatProblems('- uno\n- dos').join(), /listas/)
  assert.match(bodyFormatProblems('1. uno').join(), /listas/)
  assert.match(bodyFormatProblems('Esto es **clave**').join(), /negritas/)
  assert.match(bodyFormatProblems('# Título\n\nTexto').join(), /subtítulos/)
  assert.match(bodyFormatProblems('### Título\n\nTexto').join(), /subtítulos/)
  assert.deepEqual(bodyFormatProblems('Uno.\n\n## Dos\n\nTres.\n\nCuatro.'), [])
})

test('el cuerpo necesita al menos 3 párrafos', () => {
  assert.match(bodyFormatProblems('Uno solo.\n\n## Sub\n\nDos.').join(), /párrafos/)
})
```

Run: `npm test` → Expected: FAIL (no existe `./rules.ts`).

- [ ] **Step 3: Implementación**

```ts
// lib/news/rules.ts
import type { NewsDraft, NewsLocale, SourceContext } from './types'

// Reglas de cada nota (spec 2026-10-09-noticias-ia). Las usan /api/noticias/validar y la
// publicación; n8n reescribe una vez con estos problemas antes de rendirse.
export const BODY_WORDS: Record<NewsLocale, { min: number; max: number }> = {
  es: { min: 400, max: 600 },
  en: { min: 340, max: 690 },
}
export const TITLE_MAX = 110
export const SUMMARY_LENGTH = { min: 80, max: 200 }
export const ALT_MAX = 200
export const COPY_RUN = 8
const SOURCE_MIN_WORDS = 150
const MIN_PARAGRAPHS = 3

// "high-level" es inglés común; la marca va junta, con espacios o con guiones
const BANNED = /go[\s-]*high[\s-]*level|highlevel|\bghl\b/gi

const tokens = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)

export function countWords(text: string): number {
  return text
    .replace(/^##\s+/gm, '')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length
}

export function findBannedTerms(text: string): string[] {
  return [...text.matchAll(BANNED)].map((m) => m[0])
}

// Tramos de `run` palabras o más que el texto comparte con la fuente (normalizados)
export function copiedPhrases(text: string, source: string, run = COPY_RUN): string[] {
  const src = tokens(source)
  const grams = new Set<string>()
  for (let i = 0; i + run <= src.length; i++) grams.add(src.slice(i, i + run).join(' '))

  const words = tokens(text)
  const found: string[] = []
  let i = 0
  while (i + run <= words.length) {
    if (!grams.has(words.slice(i, i + run).join(' '))) {
      i++
      continue
    }
    // Alarga el tramo mientras siga coincidiendo
    let end = i + run
    while (end < words.length && grams.has(words.slice(end - run + 1, end + 1).join(' '))) end++
    found.push(words.slice(i, end).join(' '))
    i = end
  }
  return found
}

export function bodyFormatProblems(body: string): string[] {
  const problems: string[] = []
  if (/<\/?[a-z][^>]*>/i.test(body)) problems.push('El cuerpo tiene HTML.')
  if (/https?:\/\/|www\.|\]\(/i.test(body)) problems.push('El cuerpo tiene links; la fuente va aparte.')
  const lines = body.split('\n').map((l) => l.trim())
  if (lines.some((l) => /^([-*+•]|\d+[.)])\s/.test(l))) problems.push('El cuerpo no lleva listas.')
  if (/[*`]/.test(body)) problems.push('El cuerpo no lleva negritas, cursivas ni código.')
  if (lines.some((l) => l.startsWith('#') && !/^## \S/.test(l)))
    problems.push('Solo se permiten subtítulos con «## ».')
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith('#'))
  if (paragraphs.length < MIN_PARAGRAPHS) problems.push(`El cuerpo necesita al menos ${MIN_PARAGRAPHS} párrafos.`)
  return problems
}

export function validateDraft(draft: NewsDraft, locale: NewsLocale, source: SourceContext): string[] {
  const out: string[] = []
  const add = (msg: string) => out.push(`[${locale}] ${msg}`)
  const titulo = draft.titulo.trim()
  const resumen = draft.resumen.trim()

  if (!titulo) add('Falta el título.')
  else if (titulo.length > TITLE_MAX) add(`El título tiene ${titulo.length} caracteres; máximo ${TITLE_MAX}.`)
  if (resumen.length < SUMMARY_LENGTH.min || resumen.length > SUMMARY_LENGTH.max)
    add(`El resumen tiene ${resumen.length} caracteres; debe tener entre ${SUMMARY_LENGTH.min} y ${SUMMARY_LENGTH.max}.`)
  const alt = draft.imagen_alt.trim()
  if (!alt || alt.length > ALT_MAX) add(`Falta el texto alternativo de la imagen o pasa de ${ALT_MAX} caracteres.`)

  const n = countWords(draft.cuerpo)
  const range = BODY_WORDS[locale]
  if (n < range.min || n > range.max) add(`El cuerpo tiene ${n} palabras; debe tener entre ${range.min} y ${range.max}.`)
  for (const p of bodyFormatProblems(draft.cuerpo)) add(p)

  const all = [titulo, resumen, draft.cuerpo, alt, source.fuente_nombre].join('\n')
  const banned = findBannedTerms(all)
  if (banned.length) add(`Menciona un término prohibido: ${[...new Set(banned)].join(', ')}.`)

  let url: URL | null = null
  try {
    url = new URL(source.fuente_url)
  } catch {}
  if (!url || url.protocol !== 'https:') add('El link de la fuente tiene que ser https.')
  if (!source.fuente_nombre.trim()) add('Falta el nombre de la fuente.')

  if (countWords(source.fuente_texto) < SOURCE_MIN_WORDS) {
    add(`El texto de la fuente llegó con menos de ${SOURCE_MIN_WORDS} palabras; no se puede revisar que nada esté copiado.`)
  } else {
    const copied = copiedPhrases([titulo, resumen, draft.cuerpo].join('\n'), source.fuente_texto)
    if (copied.length) add(`Tiene frases copiadas de la fuente: «${copied.slice(0, 3).join('», «')}».`)
  }
  return out
}
```

Run: `npm test` → Expected: PASS (las pruebas viejas también).

- [ ] **Step 4: Commit**

```bash
git checkout tsconfig.tsbuildinfo 2>/dev/null; git add lib/news && git commit -m "feat(noticias): reglas de cada nota, con pruebas"
```

---

### Task 3: Cuerpo, slug, links firmados y forma de los pedidos

**Files:**
- Create: `lib/news/body.ts`, `lib/news/slug.ts`, `lib/news/links.ts`, `lib/news/payload.ts`
- Create: una prueba por archivo: `body.test.ts`, `slug.test.ts`, `links.test.ts` y `payload.test.ts`

**Interfaces:**
- Produces:
  - `BodyBlock = { type: 'h2' | 'p'; text: string }`;
  - `parseBody(body): BodyBlock[]`;
  - `slugify(title, max = 80): string`;
  - `uniqueSlug(base, taken: string[]): string`;
  - `signNewsToken(secret, id, action): string`;
  - `verifyNewsToken(secret, id, action, token): boolean`;
  - `isNewsAction(v): v is NewsAction`;
  - `escapeHtml(s): string`;
  - `PublishInput` y `ValidateInput` (tipos de zod);
  - `parsePublish(body)`, `parseValidate(body)`, ambas devuelven `{ ok: true, value } | { ok: false, problems: string[] }`;
  - `decodeImage(b64): Buffer`.

- [ ] **Step 1: Pruebas (fallan)**

```ts
// lib/news/body.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBody } from './body.ts'

test('párrafos separados por línea en blanco y subtítulos ##', () => {
  assert.deepEqual(parseBody('Uno\nsigue.\n\n## Por qué importa\nDos.\r\n\r\nTres.'), [
    { type: 'p', text: 'Uno sigue.' },
    { type: 'h2', text: 'Por qué importa' },
    { type: 'p', text: 'Dos.' },
    { type: 'p', text: 'Tres.' },
  ])
})

test('sin texto no hay bloques', () => {
  assert.deepEqual(parseBody('  \n\n '), [])
})
```

```ts
// lib/news/slug.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slugify, uniqueSlug } from './slug.ts'

test('slugify: sin acentos, ñ → n, solo letras, números y guiones', () => {
  assert.equal(slugify('¿Qué cambia con GPT-6 para las pymes? Año 2026'), 'que-cambia-con-gpt-6-para-las-pymes-ano-2026')
})

test('slugify corta en un guion, sin pasarse del máximo', () => {
  const s = slugify('palabra '.repeat(30), 40)
  assert.ok(s.length <= 40)
  assert.ok(!s.endsWith('-'))
})

test('slugify nunca devuelve vacío', () => {
  assert.equal(slugify('¿¡!?'), 'nota')
})

test('uniqueSlug agrega -2, -3… si ya existe', () => {
  assert.equal(uniqueSlug('ia', []), 'ia')
  assert.equal(uniqueSlug('ia', ['ia']), 'ia-2')
  assert.equal(uniqueSlug('ia', ['ia', 'ia-2', 'ia-3']), 'ia-4')
})
```

```ts
// lib/news/links.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { escapeHtml, isNewsAction, signNewsToken, verifyNewsToken } from './links.ts'

const S = 'secreto-de-prueba'

test('un token sirve solo para su nota y su acción', () => {
  const t = signNewsToken(S, 'id-1', 'ocultar')
  assert.equal(verifyNewsToken(S, 'id-1', 'ocultar', t), true)
  assert.equal(verifyNewsToken(S, 'id-1', 'publicar', t), false)
  assert.equal(verifyNewsToken(S, 'id-2', 'ocultar', t), false)
  assert.equal(verifyNewsToken('otro', 'id-1', 'ocultar', t), false)
  assert.equal(verifyNewsToken(S, 'id-1', 'ocultar', t.slice(0, -1)), false)
  assert.equal(verifyNewsToken(S, 'id-1', 'ocultar', ''), false)
})

test('sin secreto no se firma ni se verifica', () => {
  assert.throws(() => signNewsToken('', 'id-1', 'ver'))
  assert.equal(verifyNewsToken('', 'id-1', 'ver', 'x'), false)
})

test('isNewsAction', () => {
  assert.equal(isNewsAction('ocultar'), true)
  assert.equal(isNewsAction('borrar'), false)
})

test('escapeHtml', () => {
  assert.equal(escapeHtml(`<b>"Hola" & 'chau'</b>`), '&lt;b&gt;&quot;Hola&quot; &amp; &#39;chau&#39;&lt;/b&gt;')
})
```

```ts
// lib/news/payload.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeImage, parsePublish, parseValidate } from './payload.ts'

const draft = { titulo: 't', resumen: 'r', cuerpo: 'c', imagen_alt: 'a' }
const ok = {
  es: draft,
  en: draft,
  fuente_url: 'https://x.com/a',
  fuente_nombre: 'X',
  fuente_texto: 'texto',
  imagen_base64: 'aGVsbG8=',
  estado: 'oculta',
}

test('parsePublish acepta el pedido completo', () => {
  const r = parsePublish(ok)
  assert.equal(r.ok, true)
})

test('parsePublish dice qué falta', () => {
  const r = parsePublish({ ...ok, en: { titulo: 't' }, estado: 'borrador' })
  assert.equal(r.ok, false)
  if (!r.ok) {
    const all = r.problems.join('\n')
    assert.match(all, /en\.cuerpo/)
    assert.match(all, /estado/)
  }
})

test('parsePublish rechaza lo que no es objeto', () => {
  assert.equal(parsePublish(null).ok, false)
})

test('parseValidate', () => {
  assert.equal(parseValidate({ idioma: 'es', borrador: draft, fuente_url: 'u', fuente_nombre: 'n', fuente_texto: 't' }).ok, true)
  assert.equal(parseValidate({ idioma: 'pt', borrador: draft }).ok, false)
})

test('decodeImage acepta base64 con o sin prefijo data:', () => {
  assert.equal(decodeImage('aGVsbG8=').toString(), 'hello')
  assert.equal(decodeImage('data:image/png;base64,aGVsbG8=').toString(), 'hello')
})
```

Run: `npm test` → Expected: FAIL (faltan los módulos).

- [ ] **Step 2: Implementación**

```ts
// lib/news/body.ts
// El cuerpo de una nota: párrafos separados por línea en blanco y subtítulos "## ".
// Se pinta como texto (React lo escapa); no se interpreta ningún otro markdown.
export type BodyBlock = { type: 'h2' | 'p'; text: string }

export function parseBody(body: string): BodyBlock[] {
  const blocks: BodyBlock[] = []
  for (const chunk of body.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    let para: string[] = []
    const flush = () => {
      if (para.length) blocks.push({ type: 'p', text: para.join(' ') })
      para = []
    }
    for (const raw of chunk.split('\n')) {
      const line = raw.trim()
      if (!line) continue
      if (line.startsWith('## ')) {
        flush()
        blocks.push({ type: 'h2', text: line.slice(3).trim() })
      } else para.push(line)
    }
    flush()
  }
  return blocks
}
```

```ts
// lib/news/slug.ts
export function slugify(title: string, max = 80): string {
  const s = title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!s) return 'nota'
  if (s.length <= max) return s
  const cut = s.slice(0, max + 1)
  const at = cut.lastIndexOf('-')
  return (at > 0 ? cut.slice(0, at) : s.slice(0, max)).replace(/-+$/, '')
}

// Si dos notas dan el mismo slug, la nueva lleva -2, -3…
export function uniqueSlug(base: string, taken: string[]): string {
  const used = new Set(taken)
  if (!used.has(base)) return base
  let n = 2
  while (used.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}
```

```ts
// lib/news/links.ts
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NewsAction } from './types'

// Links del correo (ver la vista previa, publicar, ocultar): un HMAC por nota y acción,
// sin vencimiento; solo cambian la visibilidad de una nota.
const ACTIONS: readonly NewsAction[] = ['ver', 'publicar', 'ocultar']

export const isNewsAction = (v: unknown): v is NewsAction => ACTIONS.includes(v as NewsAction)

export function signNewsToken(secret: string, id: string, action: NewsAction): string {
  if (!secret) throw new Error('Falta NEWS_LINK_SECRET')
  return createHmac('sha256', secret).update(`noticias:${id}:${action}`).digest('base64url')
}

export function verifyNewsToken(secret: string, id: string, action: NewsAction, token: string): boolean {
  if (!secret || !token) return false
  const want = Buffer.from(signNewsToken(secret, id, action))
  const got = Buffer.from(token)
  return want.length === got.length && timingSafeEqual(want, got)
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
```

```ts
// lib/news/payload.ts
import { z } from 'zod'

// Forma de los pedidos que manda n8n. Las reglas de contenido están en rules.ts.
const draft = z.object({ titulo: z.string(), resumen: z.string(), cuerpo: z.string(), imagen_alt: z.string() })
const source = { fuente_url: z.string(), fuente_nombre: z.string(), fuente_texto: z.string() }

const publishSchema = z.object({
  es: draft,
  en: draft,
  ...source,
  imagen_base64: z.string().min(1),
  estado: z.enum(['publicada', 'oculta']),
})
const validateSchema = z.object({ idioma: z.enum(['es', 'en']), borrador: draft, ...source })

export type PublishInput = z.infer<typeof publishSchema>
export type ValidateInput = z.infer<typeof validateSchema>
type Parsed<T> = { ok: true; value: T } | { ok: false; problems: string[] }

function parse<T>(schema: z.ZodType<T>, body: unknown): Parsed<T> {
  const r = schema.safeParse(body)
  if (r.success) return { ok: true, value: r.data }
  return { ok: false, problems: r.error.issues.map((i) => `${i.path.join('.') || 'pedido'}: ${i.message}`) }
}

export const parsePublish = (body: unknown) => parse(publishSchema, body)
export const parseValidate = (body: unknown) => parse(validateSchema, body)

export function decodeImage(b64: string): Buffer {
  return Buffer.from(b64.replace(/^data:[^;]+;base64,/, ''), 'base64')
}
```

Run: `npm test` → Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git checkout tsconfig.tsbuildinfo 2>/dev/null; git add lib/news && git commit -m "feat(noticias): cuerpo, slug, links firmados y forma de los pedidos"
```

---

### Task 4: Portada con la firma

**Files:**
- Create: `lib/news/fonts/sora-500.woff` (de `@fontsource/sora@5.1.1/files/sora-latin-500-normal.woff`), `lib/news/fonts/OFL.txt` (licencia de Sora, de `github.com/sora-xor/sora-font`)
- Create: `lib/news/cover.ts`, `lib/news/cover.test.ts`
- Modify: `package.json` (con `npm install sharp satori`)

**Interfaces:**
- Produces: `COVER = { width: 1600, height: 900 }`, `SIGNATURE`, `composeCover(input: Buffer): Promise<Buffer>` (devuelve un JPEG).

- [ ] **Step 1: Dependencias y fuente**

```bash
npm install sharp satori
mkdir -p lib/news/fonts
curl -sf -o lib/news/fonts/sora-500.woff https://cdn.jsdelivr.net/npm/@fontsource/sora@5.1.1/files/sora-latin-500-normal.woff
curl -sf -o lib/news/fonts/OFL.txt https://raw.githubusercontent.com/sora-xor/sora-font/master/OFL.txt
```

Si el OFL no está en esa ruta, sacarlo de `https://cdn.jsdelivr.net/npm/@fontsource/sora@5.1.1/LICENSE`.

- [ ] **Step 2: Prueba (falla)**

```ts
// lib/news/cover.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { composeCover } from './cover.ts'

const gray = (width: number, height: number, format: 'png' | 'jpeg') =>
  sharp({ create: { width, height, channels: 3, background: { r: 60, g: 60, b: 60 } } })[format]().toBuffer()

const brightest = async (img: Buffer, left: number, top: number, width: number, height: number) => {
  const { channels } = await sharp(img).extract({ left, top, width, height }).stats()
  return Math.max(...channels.map((c) => c.max))
}

test('la portada sale en JPEG de 1600×900, también desde un PNG de 1376×768', async () => {
  for (const input of [await gray(2752, 1536, 'jpeg'), await gray(1376, 768, 'png')]) {
    const out = await composeCover(input)
    const meta = await sharp(out).metadata()
    assert.equal(meta.format, 'jpeg')
    assert.equal(meta.width, 1600)
    assert.equal(meta.height, 900)
  }
})

test('la firma va abajo a la derecha y no toca el resto', async () => {
  const out = await composeCover(await gray(1600, 900, 'jpeg'))
  assert.ok((await brightest(out, 1000, 800, 600, 100)) > 180, 'hay texto claro abajo a la derecha')
  assert.ok((await brightest(out, 0, 0, 600, 300)) < 90, 'arriba a la izquierda sigue gris')
})
```

Run: `npm test` → Expected: FAIL (no existe `./cover.ts`).

- [ ] **Step 3: Implementación**

```ts
// lib/news/cover.ts
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import satori from 'satori'
import sharp from 'sharp'

// Portada de cada nota: la imagen de Nano Banana recortada a 1600×900, con la firma
// dibujada por código (nunca por el modelo) en Sora, la fuente del sitio.
export const COVER = { width: 1600, height: 900 }
export const SIGNATURE = 'Alejandro Aguilar · CEO Bralto'

// La fuente viaja con la función de Vercel (outputFileTracingIncludes en next.config.ts)
let font: Promise<Buffer> | undefined
const loadFont = () => (font ??= readFile(path.join(process.cwd(), 'lib/news/fonts/sora-500.woff')))

async function signatureSvg(): Promise<string> {
  const { width, height } = COVER
  return satori(
    {
      type: 'div',
      key: null,
      props: {
        style: {
          width,
          height,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: '0 48px 40px 0',
          // Un velo oscuro solo en la esquina, para que la firma se lea sobre cualquier imagen
          backgroundImage: 'radial-gradient(ellipse 620px 260px at 100% 100%, rgba(0,0,0,0.55), rgba(0,0,0,0))',
        },
        children: {
          type: 'div',
          key: null,
          props: {
            style: { fontFamily: 'Sora', fontSize: 24, letterSpacing: 0.2, color: 'rgba(255,255,255,0.92)' },
            children: SIGNATURE,
          },
        },
      },
    } as Parameters<typeof satori>[0],
    { width, height, fonts: [{ name: 'Sora', data: await loadFont(), weight: 500, style: 'normal' }] },
  )
}

export async function composeCover(input: Buffer): Promise<Buffer> {
  const { width, height } = COVER
  const overlay = Buffer.from(await signatureSvg())
  return sharp(input)
    .resize(width, height, { fit: 'cover', position: 'attention' })
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer()
}
```

Run: `npm test` → Expected: PASS. Si satori no acepta `radial-gradient` con elipse, usar `linear-gradient(to top left, rgba(0,0,0,0.55), rgba(0,0,0,0) 40%)` y volver a correr.

- [ ] **Step 4: Ver la portada a ojo**

Con un script en el scratchpad: componer una imagen real (cualquier JPEG oscuro de `public/`), guardar el resultado en el scratchpad y abrirlo con Read. Ajustar el tamaño o la opacidad si la firma no se lee o si se ve grande.

- [ ] **Step 5: Commit**

```bash
git checkout tsconfig.tsbuildinfo 2>/dev/null; git add package.json package-lock.json lib/news && git commit -m "feat(noticias): portada 1600×900 con la firma en Sora"
```

---

### Task 5: Datos y endpoints

**Files:**
- Create: `lib/news/store.ts`, `lib/news/api-key.ts`
- Create: `app/api/noticias/route.ts`, `app/api/noticias/validar/route.ts`, `app/api/noticias/recientes/route.ts`, `app/api/noticias/estado/route.ts`
- Modify: `next.config.ts` (agregar `outputFileTracingIncludes`), `.env.local` (agregar `NEWS_API_KEY` y `NEWS_LINK_SECRET`; antes, respaldo en `.local-backups/`)

**Interfaces:**
- Consumes: todo `lib/news/*` de las tareas 2 a 4 y `createServiceClient()` de `lib/supabase/service.ts`.
- Produces, en `store.ts`:
  - `PAGE_SIZE = 24`;
  - `listPublished(page): Promise<{ items: NewsRow[]; hasMore: boolean }>`;
  - `getPublished(slug)`, `getAnyBySlug(slug)` y `getById(id)`, las tres devuelven `Promise<NewsRow | null>`;
  - `listForSitemap(): Promise<{ slug: string; actualizada_en: string }[]>`;
  - `recentForDedup(): Promise<{ fuentes: string[]; titulos: string[] }>`;
  - `sourceExists(url)`;
  - `takenSlugs(base)`;
  - `uploadCover(path, jpeg): Promise<string>`;
  - `removeCover(path)`;
  - `insertNews(row): Promise<NewsRow>`;
  - `setStatus(id, estado): Promise<NewsRow | null>`.
- Produce también la respuesta de `POST /api/noticias` (201):

  ```
  { id, slug, estado, titulo_es, url_es, url_en, vista_previa: string | null, accion: { publicar?: string, ocultar?: string } }
  ```

- [ ] **Step 1: `lib/news/api-key.ts`**

```ts
import { timingSafeEqual } from 'node:crypto'

// n8n llama a /api/noticias con el header x-api-key = NEWS_API_KEY
export function hasNewsApiKey(req: Request): boolean {
  const want = process.env.NEWS_API_KEY
  const got = req.headers.get('x-api-key')
  if (!want || !got) return false
  const a = Buffer.from(want)
  const b = Buffer.from(got)
  return a.length === b.length && timingSafeEqual(a, b)
}
```

- [ ] **Step 2: `lib/news/store.ts`**

```ts
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/service'
import type { NewsRow, NewsStatus } from './types'

// Lecturas públicas con la clave anónima (RLS: solo lo publicado); escrituras y vista
// previa con la service role. Todo se consulta en cada visita: ocultar es inmediato.
const TABLE = 'noticias'
export const BUCKET = 'noticias'
export const PAGE_SIZE = 24
const COLUMNS =
  'id, slug, titulo_es, resumen_es, cuerpo_es, imagen_alt_es, titulo_en, resumen_en, cuerpo_en, imagen_alt_en, fuente_url, fuente_nombre, imagen_url, publicada_en, estado, actualizada_en'

function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`noticias: ${what}: ${error?.message ?? 'sin respuesta'}`)
}

export async function listPublished(page: number): Promise<{ items: NewsRow[]; hasMore: boolean }> {
  const from = (Math.max(1, page) - 1) * PAGE_SIZE
  const { data, error } = await publicClient()
    .from(TABLE)
    .select(COLUMNS)
    .eq('estado', 'publicada')
    .order('publicada_en', { ascending: false })
    .range(from, from + PAGE_SIZE) // uno de más para saber si hay otra página
  if (error) fail('listado', error)
  const rows = (data ?? []) as NewsRow[]
  return { items: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE }
}

export async function getPublished(slug: string): Promise<NewsRow | null> {
  const { data, error } = await publicClient().from(TABLE).select(COLUMNS).eq('slug', slug).eq('estado', 'publicada').maybeSingle()
  if (error) fail('nota', error)
  return data as NewsRow | null
}

export async function getAnyBySlug(slug: string): Promise<NewsRow | null> {
  const { data, error } = await createServiceClient().from(TABLE).select(COLUMNS).eq('slug', slug).maybeSingle()
  if (error) fail('vista previa', error)
  return data as NewsRow | null
}

export async function getById(id: string): Promise<NewsRow | null> {
  const { data, error } = await createServiceClient().from(TABLE).select(COLUMNS).eq('id', id).maybeSingle()
  if (error) fail('nota por id', error)
  return data as NewsRow | null
}

export async function listForSitemap(): Promise<{ slug: string; actualizada_en: string }[]> {
  const { data, error } = await publicClient().from(TABLE).select('slug, actualizada_en').eq('estado', 'publicada')
  if (error) fail('sitemap', error)
  return data ?? []
}

// Todo lo ya guardado (también lo oculto) y los títulos de las últimas 2 semanas
export async function recentForDedup(): Promise<{ fuentes: string[]; titulos: string[] }> {
  const db = createServiceClient()
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString()
  const [all, recent] = await Promise.all([
    db.from(TABLE).select('fuente_url'),
    db.from(TABLE).select('titulo_es').gte('creada_en', since).order('creada_en', { ascending: false }),
  ])
  if (all.error) fail('fuentes usadas', all.error)
  if (recent.error) fail('títulos recientes', recent.error)
  return { fuentes: (all.data ?? []).map((r) => r.fuente_url), titulos: (recent.data ?? []).map((r) => r.titulo_es) }
}

export async function sourceExists(url: string): Promise<boolean> {
  const { count, error } = await createServiceClient().from(TABLE).select('id', { count: 'exact', head: true }).eq('fuente_url', url)
  if (error) fail('fuente repetida', error)
  return (count ?? 0) > 0
}

export async function takenSlugs(base: string): Promise<string[]> {
  const { data, error } = await createServiceClient().from(TABLE).select('slug').like('slug', `${base}%`)
  if (error) fail('slugs', error)
  return (data ?? []).map((r) => r.slug)
}

export async function uploadCover(path: string, jpeg: Buffer): Promise<string> {
  const storage = createServiceClient().storage.from(BUCKET)
  const { error } = await storage.upload(path, jpeg, { contentType: 'image/jpeg', upsert: false, cacheControl: '31536000' })
  if (error) fail('subir portada', error)
  return storage.getPublicUrl(path).data.publicUrl
}

export async function removeCover(path: string): Promise<void> {
  await createServiceClient().storage.from(BUCKET).remove([path])
}

export async function insertNews(row: Omit<NewsRow, 'id' | 'publicada_en' | 'actualizada_en'>): Promise<NewsRow> {
  const { data, error } = await createServiceClient().from(TABLE).insert(row).select(COLUMNS).single()
  if (error) fail('guardar', error)
  return data as NewsRow
}

// Publicar desde el correo pone la fecha de hoy: es cuando sale al sitio
export async function setStatus(id: string, estado: NewsStatus): Promise<NewsRow | null> {
  const patch = estado === 'publicada' ? { estado, publicada_en: new Date().toISOString() } : { estado }
  const { data, error } = await createServiceClient().from(TABLE).update(patch).eq('id', id).select(COLUMNS).maybeSingle()
  if (error) fail('cambiar estado', error)
  return data as NewsRow | null
}
```

- [ ] **Step 3: `app/api/noticias/route.ts` (publicar)**

```ts
import { NextResponse } from 'next/server'
import { hasNewsApiKey } from '@/lib/news/api-key'
import { composeCover } from '@/lib/news/cover'
import { signNewsToken } from '@/lib/news/links'
import { decodeImage, parsePublish } from '@/lib/news/payload'
import { validateDraft } from '@/lib/news/rules'
import { slugify, uniqueSlug } from '@/lib/news/slug'
import { insertNews, removeCover, sourceExists, takenSlugs, uploadCover } from '@/lib/news/store'

export const runtime = 'nodejs'
export const maxDuration = 60

// Publica la nota que arma n8n: valida, firma la portada, la sube y guarda la fila.
// Si algo falla no queda nada a medias (la portada se borra si la fila no se guarda).
export async function POST(req: Request) {
  if (!hasNewsApiKey(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const parsed = parsePublish(body)
  if (!parsed.ok) return NextResponse.json({ error: 'Pedido incompleto', problemas: parsed.problems }, { status: 400 })
  const input = parsed.value

  const source = { fuente_url: input.fuente_url, fuente_nombre: input.fuente_nombre, fuente_texto: input.fuente_texto }
  const problemas = [...validateDraft(input.es, 'es', source), ...validateDraft(input.en, 'en', source)]
  if (problemas.length) return NextResponse.json({ error: 'La nota no cumple las reglas', problemas }, { status: 422 })

  if (await sourceExists(input.fuente_url))
    return NextResponse.json({ error: 'Esa fuente ya tiene una nota' }, { status: 409 })

  let cover: Buffer
  try {
    cover = await composeCover(decodeImage(input.imagen_base64))
  } catch (err) {
    return NextResponse.json({ error: `La imagen no se pudo procesar: ${err instanceof Error ? err.message : err}` }, { status: 422 })
  }

  const base = slugify(input.es.titulo)
  const slug = uniqueSlug(base, await takenSlugs(base))
  const path = `${new Date().getUTCFullYear()}/${slug}.jpg`
  const imagen_url = await uploadCover(path, cover)

  let row
  try {
    row = await insertNews({
      slug,
      titulo_es: input.es.titulo.trim(),
      resumen_es: input.es.resumen.trim(),
      cuerpo_es: input.es.cuerpo.trim(),
      imagen_alt_es: input.es.imagen_alt.trim(),
      titulo_en: input.en.titulo.trim(),
      resumen_en: input.en.resumen.trim(),
      cuerpo_en: input.en.cuerpo.trim(),
      imagen_alt_en: input.en.imagen_alt.trim(),
      fuente_url: input.fuente_url,
      fuente_nombre: input.fuente_nombre.trim(),
      imagen_url,
      estado: input.estado,
    })
  } catch (err) {
    await removeCover(path)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }

  // Links del correo, hacia el mismo despliegue que publicó (producción o preview)
  const origin = new URL(req.url).origin
  const secret = process.env.NEWS_LINK_SECRET ?? ''
  const action = (a: 'publicar' | 'ocultar') => `${origin}/api/noticias/estado?id=${row.id}&accion=${a}&t=${signNewsToken(secret, row.id, a)}`
  const hidden = row.estado === 'oculta'
  return NextResponse.json(
    {
      id: row.id,
      slug: row.slug,
      estado: row.estado,
      titulo_es: row.titulo_es,
      url_es: `${origin}/es/noticias/${row.slug}`,
      url_en: `${origin}/en/noticias/${row.slug}`,
      vista_previa: hidden ? `${origin}/es/noticias/${row.slug}?vista=${signNewsToken(secret, row.id, 'ver')}` : null,
      accion: hidden ? { publicar: action('publicar') } : { ocultar: action('ocultar') },
    },
    { status: 201 },
  )
}
```

- [ ] **Step 4: `validar` y `recientes`**

```ts
// app/api/noticias/validar/route.ts
import { NextResponse } from 'next/server'
import { hasNewsApiKey } from '@/lib/news/api-key'
import { parseValidate } from '@/lib/news/payload'
import { validateDraft } from '@/lib/news/rules'

// n8n revisa cada borrador antes de seguir (y lo reescribe una vez con estos problemas)
export async function POST(req: Request) {
  if (!hasNewsApiKey(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const parsed = parseValidate(await req.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ ok: false, problemas: parsed.problems }, { status: 400 })
  const { idioma, borrador, fuente_url, fuente_nombre, fuente_texto } = parsed.value
  const problemas = validateDraft(borrador, idioma, { fuente_url, fuente_nombre, fuente_texto })
  return NextResponse.json({ ok: problemas.length === 0, problemas })
}
```

```ts
// app/api/noticias/recientes/route.ts
import { NextResponse } from 'next/server'
import { hasNewsApiKey } from '@/lib/news/api-key'
import { recentForDedup } from '@/lib/news/store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!hasNewsApiKey(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(await recentForDedup())
}
```

- [ ] **Step 5: `estado` (botones del correo)**

```ts
// app/api/noticias/estado/route.ts
import { escapeHtml, isNewsAction, verifyNewsToken } from '@/lib/news/links'
import { getById, setStatus } from '@/lib/news/store'

export const dynamic = 'force-dynamic'

// Botones del correo. GET solo muestra la confirmación (los correos abren los links solos);
// el cambio lo hace el POST del formulario.
const VERB = { publicar: 'Publicar', ocultar: 'Ocultar' } as const

function page(title: string, inner: string, status = 200) {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#060607;color:#f4f4f5;font:16px/1.6 system-ui,sans-serif;padding:24px}main{max-width:520px}h1{font-size:22px;font-weight:600;margin:0 0 12px}p{color:#a1a1aa;margin:0 0 20px}button,a.b{display:inline-block;background:#ff6d28;color:#0a0a0a;border:0;border-radius:999px;padding:12px 22px;font:600 15px system-ui,sans-serif;cursor:pointer;text-decoration:none}a{color:#ff8a52}</style></head><body><main>${inner}</main></body></html>`
  return new Response(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } })
}

async function check(req: Request) {
  const q = new URL(req.url).searchParams
  const id = q.get('id') ?? ''
  const accion = q.get('accion')
  const t = q.get('t') ?? ''
  if (!isNewsAction(accion) || accion === 'ver' || !verifyNewsToken(process.env.NEWS_LINK_SECRET ?? '', id, accion, t)) return null
  const row = await getById(id)
  return row ? { row, accion } : null
}

export async function GET(req: Request) {
  const ok = await check(req)
  if (!ok) return page('Link no válido', '<h1>Este link no es válido</h1><p>Puede que esté incompleto. Ábralo de nuevo desde el correo.</p>', 403)
  const { row, accion } = ok
  const done = (accion === 'publicar') === (row.estado === 'publicada')
  if (done) return page('Sin cambios', `<h1>La nota ya está ${row.estado}</h1><p>${escapeHtml(row.titulo_es)}</p>`)
  return page(
    `${VERB[accion]} nota`,
    `<h1>¿${VERB[accion]} esta nota?</h1><p>${escapeHtml(row.titulo_es)}</p><form method="post"><button type="submit">${VERB[accion]}</button></form>`,
  )
}

export async function POST(req: Request) {
  const ok = await check(req)
  if (!ok) return page('Link no válido', '<h1>Este link no es válido</h1>', 403)
  const row = await setStatus(ok.row.id, ok.accion === 'publicar' ? 'publicada' : 'oculta')
  if (!row) return page('No se encontró', '<h1>No se encontró la nota</h1>', 404)
  const url = `${new URL(req.url).origin}/es/noticias/${row.slug}`
  const msg = row.estado === 'publicada' ? `Ya está en el sitio: <a href="${url}">verla</a>.` : 'Ya no aparece en el sitio.'
  return page('Listo', `<h1>Listo: la nota quedó ${row.estado}</h1><p>${escapeHtml(row.titulo_es)}</p><p>${msg}</p>`)
}
```

- [ ] **Step 6: Configuración y variables**

En `next.config.ts`, dentro de `nextConfig`:

```ts
  // La fuente de la firma de las portadas viaja con la función que publica las noticias
  outputFileTracingIncludes: { '/api/noticias': ['./lib/news/fonts/**'] },
```

Además, en `images.remotePatterns`, agregar `{ protocol: 'https', hostname: '<host de NEXT_PUBLIC_SUPABASE_URL>', pathname: '/storage/v1/object/public/noticias/**' }`.

Generar los dos secretos con `openssl rand -base64 32 | tr '+/' '-_' | tr -d '='`. Respaldar `.env.local` en `.local-backups/env.local.2026-10-09-noticias.bak` y agregarle `NEWS_API_KEY=` y `NEWS_LINK_SECRET=`.

- [ ] **Step 7: Prueba de integración en local**

1. Levantar `npm run dev -- -p 3102`.
2. Con un script del scratchpad, armar un pedido válido:
   - cuerpo ES de unas 480 palabras y EN de unas 450, escritos sin copiar de la fuente;
   - una `fuente_texto` distinta de unas 300 palabras;
   - una imagen JPEG oscura de 2752×1536 en base64;
   - `estado: 'oculta'`.
3. Verificar estas respuestas:
   - Sin header: 401.
   - Con un cuerpo de 300 palabras: 422 con `problemas`.
   - Pedido válido: 201, con `vista_previa` y `accion.publicar`.
   - El mismo pedido otra vez: 409.
   - `GET /api/noticias/recientes`: incluye la fuente.
   - `GET` del link de publicar: página con el botón. `POST`: "quedó publicada".
   - `GET` de ese link con un token cambiado: 403.
4. Abrir `imagen_url`, que tiene que ser un JPEG de 1600×900 con la firma.
5. Limpiar: borrar la fila con `pg` y la imagen con `storage.remove`.

- [ ] **Step 8: Commit**

```bash
git checkout tsconfig.tsbuildinfo 2>/dev/null; git add lib/news app/api/noticias next.config.ts && git commit -m "feat(noticias): endpoints para publicar, validar y ocultar desde el correo"
```

---

### Task 6: Páginas, menú, sitemap y metadatos

**Files:**
- Create:
  - `app/[locale]/noticias/page.tsx`, `app/[locale]/noticias/[slug]/page.tsx`;
  - `components/news/format.ts`, `components/news/news-list.tsx`, `components/news/news-article.tsx`, `components/news/news.css`.
- Modify:
  - `components/seo/JsonLd.tsx` (agregar `NewsArticleJsonLd`);
  - `components/home/home-nav.tsx` (agregar `noticias` en `NavLabels` y en `links`, después de Plataforma);
  - `components/home/shell.tsx` (pasar `noticias: t('links.noticias')`);
  - `components/home/home-footer.tsx` (agregar `<li>` en Empresa, después de Plataforma);
  - `messages/es.json`, `messages/en.json`;
  - `app/sitemap.ts`.

**Interfaces:**
- Consumes: `listPublished`, `getPublished`, `getAnyBySlug` y `PAGE_SIZE` de `store.ts`; `parseBody`; `verifyNewsToken`; `buildPageMetadata` y `SITE_URL` de `lib/seo.ts`; `FinalCta`; la foto `app/[locale]/sobre-nosotros/alejandro-aguilar.webp`.

- [ ] **Step 1: Textos.** En `messages/es.json`, agregar `Home.nav.links.noticias: "Noticias"` y este namespace raíz:

```json
"News": {
  "meta": {
    "title": "Noticias de IA para negocios | Bralto",
    "description": "Una nota cada día sobre inteligencia artificial: qué pasó, por qué importa y qué significa para su negocio."
  },
  "eyebrow": "Noticias de IA",
  "title": "Lo que pasa en IA, explicado para su negocio",
  "lead": "Una nota cada mañana: qué pasó, por qué importa y qué significa para un negocio como el suyo.",
  "empty": "Todavía no hay notas publicadas. La primera sale pronto.",
  "newer": "Notas más recientes",
  "older": "Notas anteriores",
  "author": "Alejandro Aguilar",
  "role": "CEO Bralto",
  "published": "Publicada el {date}",
  "source": "Fuente",
  "readSource": "Leer la nota original en {name}",
  "aiNote": "Redactada con apoyo de inteligencia artificial a partir de la fuente citada.",
  "preview": "Vista previa: esta nota está oculta y no aparece en el sitio.",
  "back": "Todas las noticias"
}
```

En `messages/en.json`: `Home.nav.links.noticias: "News"` y:

```json
"News": {
  "meta": {
    "title": "AI news for business | Bralto",
    "description": "One story a day about artificial intelligence: what happened, why it matters, and what it means for your business."
  },
  "eyebrow": "AI news",
  "title": "What's happening in AI, explained for your business",
  "lead": "One story every morning: what happened, why it matters, and what it means for a business like yours.",
  "empty": "No stories published yet. The first one is coming soon.",
  "newer": "Newer stories",
  "older": "Older stories",
  "author": "Alejandro Aguilar",
  "role": "CEO, Bralto",
  "published": "Published {date}",
  "source": "Source",
  "readSource": "Read the original story on {name}",
  "aiNote": "Written with the help of artificial intelligence, based on the cited source.",
  "preview": "Preview: this story is hidden and does not appear on the site.",
  "back": "All news"
}
```

Insertar con reemplazos puntuales, sin reserializar el JSON (igual que en PR #9). Run: `npm test`. Expected: PASS (`lib/home/messages.test.ts` compara las claves de ES y EN).

- [ ] **Step 2: `components/news/format.ts`**

```ts
import type { NewsRow } from '@/lib/news/types'

export type NewsLocale = 'es' | 'en'

export const formatNewsDate = (iso: string, locale: NewsLocale) =>
  new Intl.DateTimeFormat(locale === 'es' ? 'es-CR' : 'en-US', { dateStyle: 'long', timeZone: 'America/Costa_Rica' }).format(new Date(iso))

// Los campos de una nota en el idioma de la página
export const localized = (row: NewsRow, locale: NewsLocale) => ({
  titulo: locale === 'es' ? row.titulo_es : row.titulo_en,
  resumen: locale === 'es' ? row.resumen_es : row.resumen_en,
  cuerpo: locale === 'es' ? row.cuerpo_es : row.cuerpo_en,
  imagenAlt: locale === 'es' ? row.imagen_alt_es : row.imagen_alt_en,
})
```

- [ ] **Step 3: Listado.** `app/[locale]/noticias/page.tsx`:
- Lleva `export const dynamic = 'force-dynamic'`.
- `generateMetadata` usa `buildPageMetadata` con `pathByLocale: { es: '/noticias', en: '/noticias' }` y `News.meta`.
- La página lee `searchParams.p` (entero ≥ 1), llama a `listPublished(p)` y pinta `<NewsList>`.

`components/news/news-list.tsx`, componente de servidor:
- **Encabezado:** `section.hm-hero.hm-hero--page` con `p.hm-eyebrow`, `h1.hm-page-title` y `p.hm-lead`.
- **Tarjetas:** grilla `ul.nw-grid` de `li > a.nw-card.hm-glass`. Cada tarjeta tiene un `Image` 16:9 con `sizes="(min-width: 1100px) 33vw, (min-width: 700px) 50vw, 100vw"`, `time.nw-date`, `h2.nw-card__title` y `p.nw-card__lead`.
- **Sin notas:** `p.nw-empty`.
- **Paginación:** `nav.nw-pager` con los links `?p=n-1` y `?p=n+1` según `hasMore`.

- [ ] **Step 4: Nota.** `app/[locale]/noticias/[slug]/page.tsx`:

```ts
import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { NewsArticle } from '@/components/news/news-article'
import { localized } from '@/components/news/format'
import { NewsArticleJsonLd } from '@/components/seo/JsonLd'
import { verifyNewsToken } from '@/lib/news/links'
import { getAnyBySlug, getPublished } from '@/lib/news/store'
import { buildPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ vista?: string }> }
const toLocale = (l: string) => (l === 'en' ? 'en' : 'es')

// La nota publicada, o la oculta si el link del correo trae su token de vista previa
const load = cache(async (slug: string, vista?: string) => {
  if (vista) {
    const row = await getAnyBySlug(slug)
    if (row && verifyNewsToken(process.env.NEWS_LINK_SECRET ?? '', row.id, 'ver', vista))
      return { row, preview: row.estado !== 'publicada' }
  }
  const row = await getPublished(slug)
  return row ? { row, preview: false } : null
})
```

- **`generateMetadata`:** si `load` da null, devolver `{}`. Si no, usar `buildPageMetadata` con `pathByLocale` en `/noticias/${slug}` en los dos idiomas, el título y el resumen localizados y `ogImage: row.imagen_url`. Después sobrescribir:
  - `openGraph`: `{ ...base.openGraph, type: 'article', publishedTime: row.publicada_en, modifiedTime: row.actualizada_en, authors: ['Alejandro Aguilar'], images: [{ url: row.imagen_url, width: 1600, height: 900, alt }] }`;
  - `twitter.images`: `[row.imagen_url]`;
  - si `preview`, `robots: { index: false, follow: false }`.
- **Página:** `setRequestLocale`; si `load` da null, `notFound()`. Después `<><NewsArticleJsonLd …/><NewsArticle row locale preview /></>`.

`components/news/news-article.tsx`, componente de servidor, en este orden:
1. `main`, con un aviso `p.nw-preview.hm-glass[role=note]` si `preview`.
2. Encabezado: `a.nw-back` hacia `/{locale}/noticias`, `p.hm-eyebrow` con el texto de `News.eyebrow`, `h1.hm-page-title.nw-title`, `p.hm-lead` con el resumen y `div.nw-byline` (foto redonda de 40 px, `Alejandro Aguilar`, `CEO Bralto` y `time` con `News.published`).
3. `figure.nw-cover` con `Image` 1600×900, `priority` y el alt localizado.
4. `article.nw-body`, que pinta `parseBody(cuerpo)` como `h2` y `p`.
5. `aside.nw-source.hm-glass`: la etiqueta de `News.source` y un link `a[href=fuente_url][target=_blank][rel=noopener]` con el texto de `News.readSource`.
6. `p.nw-ai` con el aviso de IA.
7. `<FinalCta locale={locale} />`.

- [ ] **Step 5: `NewsArticleJsonLd`** en `components/seo/JsonLd.tsx`:

```tsx
export function NewsArticleJsonLd(props: {
  url: string
  headline: string
  description: string
  image: string
  datePublished: string
  dateModified: string
  inLanguage: 'es' | 'en'
  sourceUrl: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: props.url,
    headline: props.headline,
    description: props.description,
    image: [props.image],
    datePublished: props.datePublished,
    dateModified: props.dateModified,
    inLanguage: props.inLanguage,
    isBasedOn: props.sourceUrl,
    author: {
      '@type': 'Person',
      name: 'Alejandro Aguilar',
      jobTitle: 'CEO',
      url: `${SITE_URL}/${props.inLanguage}/sobre-nosotros`,
      worksFor: { '@type': 'Organization', name: 'Bralto', url: SITE_URL },
    },
    publisher: { '@type': 'Organization', name: 'Bralto', logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}
```

- [ ] **Step 6: `components/news/news.css`**, con los tokens de `.hm` para que funcione en los temas claro y oscuro:
- `.nw-grid`: grilla `repeat(auto-fill, minmax(min(100%, 320px), 1fr))` con `gap: 20px`.
- `.nw-card`: `display: grid`, `border-radius: var(--r-md)` y `overflow: hidden`. Su imagen con `aspect-ratio: 16/9` y `object-fit: cover`.
- `.nw-body`: mismo ritmo que `.lg-doc` (68ch, 16.5px, interlineado 1.7, `--ink-2`; los `h2` en 20px y peso 600).
- `.nw-cover img`: `width: 100%`, `height: auto` y `border-radius: var(--r-lg)`.
- `.nw-byline`: flex con `gap: 12px`.
- `.nw-source`: con padding y radio.
- `.nw-ai` y `.nw-date`: 14px en `--ink-3`.
- `.nw-preview`: borde `--accent-ink`.
- `.nw-pager`: flex con `justify-content: space-between`.

Antes de inventar valores, mirar los de `components/home/pages.css` y `legal.css` y reusarlos.

- [ ] **Step 7: Menú y pie.**
- `home-nav.tsx`: agregar `noticias: string` a `NavLabels` y `{ href: /${locale}/noticias, label: labels.noticias }` en `links`, después de Plataforma. Con eso aparece en el escritorio y en el menú móvil.
- `shell.tsx`: pasar `noticias: t('links.noticias')`.
- `home-footer.tsx`: agregar `<li><a href={/${locale}/noticias}>{t('nav.links.noticias')}</a></li>` después de Plataforma.

- [ ] **Step 8: Sitemap.** En `app/sitemap.ts`:
- Agregar `{ priority: 0.7, changeFrequency: 'weekly', path: '/noticias' }` a `ROUTES`.
- Exportar `export const dynamic = 'force-dynamic'` y volver la función `async`.
- Al final, `const news = await listForSitemap().catch(() => [])`. Por cada idioma y nota, una entrada `${SITE_URL}/${locale}/noticias/${slug}` con `lastModified: new Date(actualizada_en)`, `changeFrequency: 'monthly'`, `priority: 0.6` y los mismos `alternates`.

- [ ] **Step 9: Verificación.**
1. Correr `npx tsc --noEmit`, `npm test` y `npm run build`. Expected: los tres sin errores.
2. Con `npm run dev -- -p 3102`, insertar con el script de la tarea 5 una nota `publicada` y otra `oculta`.
3. Revisar con playwright-cli en 1440 y 390 de ancho, en los temas claro y oscuro:
   - `/es/noticias` y `/en/noticias` (la oculta no aparece);
   - la nota en ES y EN;
   - la oculta da 404 sin token y se ve con el aviso y `noindex` con el link de `vista_previa`;
   - el menú (escritorio y móvil) y el pie;
   - `view-source`: `og:type` article, `og:image` 1600×900 y JSON-LD;
   - `/sitemap.xml`: tiene la publicada y no la oculta.
4. Cambiar la publicada a `oculta` con `pg` y recargar: tiene que dar 404 al instante.
5. Limpiar las filas y las imágenes de prueba.

- [ ] **Step 10: Commit**

```bash
git checkout tsconfig.tsbuildinfo 2>/dev/null; git add app components messages && git commit -m "feat(noticias): listado, nota, menú, sitemap y metadatos"
```

---

### Task 7: Vercel y preview

- [ ] **Step 1: Cargar las variables.** Desde la carpeta principal del repo, que tiene `.vercel/`, correr `vercel env add NEWS_API_KEY production`, lo mismo para `preview` y lo mismo para `NEWS_LINK_SECRET`. El valor entra por stdin. Si la CLI pide algo interactivo que no se puede responder, pedirle a Alejandro que las agregue en el dashboard.
- [ ] **Step 2:** `git push -u origin feat/noticias-ia`, abrir el PR con `gh pr create --base main` y correr `gh pr checks <N> --watch`.
- [ ] **Step 3: Prueba en el preview** (`https://braltoio-git-feat-noticias-ia-alejandro-aguilar.vercel.app`):
  - `/es/noticias` responde 200 y muestra el estado vacío;
  - `POST /api/noticias` sin header da 401;
  - el pedido de prueba de la tarea 5 da 201 y la portada tiene la firma (confirma que la fuente viajó con la función);
  - limpiar la nota de prueba.

---

### Task 8: Flujo en n8n

**Files:**
- Create: `n8n/noticias-ia-diarias.js`, `n8n/noticias-ia-errores.js`. Es el mismo código SDK que se manda a `create_workflow_from_code`; en adelante se edita aquí y se aplica con `update_workflow`.

- [ ] **Step 1: Credenciales**, con la API REST de n8n (`N8N_SERVER_URL` y `N8N_API_KEY` de `.env.local`). Primero leer el esquema con `GET /api/v1/credentials/schema/<tipo>`. Después crear:
  - `Gemini · Bralto`, del tipo `googlePalmApi`, con `host: https://generativelanguage.googleapis.com` y `apiKey: GEMINI_API_KEY`;
  - `Resend · Bralto`, del tipo `httpHeaderAuth`, con `name: Authorization` y `value: Bearer RESEND_API_KEY`;
  - `Bralto · Noticias API`, del tipo `httpHeaderAuth`, con `name: x-api-key` y `value: NEWS_API_KEY`.

- [ ] **Step 2: Leer el SDK** con `get_sdk_reference` (incluidas las secciones guidelines y design) y `get_node_types` de estos nodos: `scheduleTrigger`, `set`, `code`, `rssFeedRead`, `httpRequest`, `if`, `splitInBatches`, `convertToFile`, `editImage` (resize), `extractFromFile`, `stopAndError`, `errorTrigger`.

- [ ] **Step 3: Workflow de errores**, "Bralto · Noticias IA · errores": Error Trigger → Code arma el asunto "Noticias IA: falló «{nodo}»" y un HTML con el mensaje y el link a la ejecución → HTTP Request `POST https://api.resend.com/emails` con la credencial de Resend:
  - `from: "Bralto Noticias <noticias@send.bralto.io>"`;
  - `to: ["aguilartradesfx@gmail.com"]`;
  - `subject` y `html`.

  Validar con `validate_workflow`, crear con `create_workflow_from_code` y anotar su id.

- [ ] **Step 4: Workflow diario**, "Bralto · Noticias IA diarias". Ajustes: `timezone: America/Costa_Rica`, `errorWorkflow: <id del paso 3>` y "Available in MCP". Los nodos, en orden:

  1. **Schedule Trigger:** todos los días a las 6:00.
  2. **Config (Set):**
     - `FEEDS`: las 15 URLs del spec, con su nombre;
     - `ENSAYO_HASTA`: la fecha de activación + 3 días, en `YYYY-MM-DD`;
     - `BASE`: la URL del preview mientras dura el ensayo, `https://www.bralto.io` después;
     - `AVISO_A`: `aguilartradesfx@gmail.com`.
  3. **Code "Lista de feeds":** un ítem por feed.
  4. **RSS Read:** con `onError: continueRegularOutput`, para que un feed caído no corte el resto.
  5. **Code "Últimas 24 h":** normaliza `{ titulo, link, resumen (≤600 caracteres, sin HTML), fuente, fecha }`, deja lo de las últimas 24 h, deduplica por link y anota los feeds que fallaron.
  6. **HTTP GET `{BASE}/api/noticias/recientes`** con la credencial de Bralto.
  7. **Code:** quita los links usados y pasa `titulos` al prompt.
  8. **IF "¿Hay candidatas?":** si no hay, correo "Hoy no se publicó: no hubo notas nuevas de IA en las últimas 24 h" y termina.
  9. **HTTP Gemini "Elegir":** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent` con la credencial `googlePalmApi`. En `generationConfig`: `responseMimeType: application/json` y `responseSchema` `{ publicar: boolean, motivo: string, candidatas: [{ link, fuente, titulo, por_que }] }` con `maxItems: 3`. Prompt:

     > Usted es el editor de noticias de IA de Bralto. Sus lectores son dueños de pequeñas y medianas empresas en Latinoamérica que no son técnicos. De la lista, elija hasta 3 noticias en orden de relevancia para ellos. Sirven: herramientas o funciones nuevas que un negocio puede usar ya, cambios de precio o de acceso en productos de uso masivo (ChatGPT, Gemini, Claude, Copilot, Meta y WhatsApp, etc.), regulación que los afecte, seguridad y casos de uso concretos. No sirven: rumores, rondas de inversión sin impacto práctico, investigación académica sin aplicación, opinión, chismes corporativos ni temas que ya cubrimos en estos títulos: {titulos}. Si ninguna tiene impacto claro para un negocio, responda publicar=false con el motivo. Noticias: {lista JSON}.
  10. **IF `publicar`:** si es false, correo "Hoy no se publicó: {motivo}" y termina.
  11. **Leer la fuente, por candidata en orden** (con Loop Over Items y salida al primer éxito):
      1. HTTP GET al link, con user-agent de navegador y continuar si falla.
      2. Code: extrae el texto de `<article>` o `<main>`, o si no de los `<p>`, sin etiquetas.
      3. Si el texto tiene menos de 250 palabras, HTTP Gemini con `tools: [{ url_context: {} }]` y `responseSchema { ok: boolean, texto: string }`. Prompt: "Lea {link} y devuelva el texto completo del artículo, sin menús, publicidad ni comentarios. Si no puede leerlo, ok=false."
      4. La primera candidata con 250 palabras o más gana. Si ninguna llega, correo "Hoy no se publicó: no se pudo leer ninguna de las fuentes elegidas" y termina.
  12. **HTTP Gemini "Redactar":** `responseSchema { titulo, resumen, cuerpo, imagen_alt, escena_imagen }`. Prompt:

      > Escriba una nota original en español neutro de Latinoamérica, tratando al lector de usted, sobre esta noticia. Fuente: {fuente} ({link}). Texto de la fuente: {texto}.
      > Reglas:
      > 1) El cuerpo tiene entre 430 y 560 palabras. Primero cuenta qué pasó; después va «## Por qué importa» y después «## Qué significa para su negocio», con ideas concretas que un dueño de negocio pueda aplicar.
      > 2) Use solo datos que estén en la fuente. No invente cifras, fechas, nombres, citas ni opiniones de terceros.
      > 3) Prohibido copiar frases de la fuente: escriba todo con sus propias palabras, nunca más de 5 palabras seguidas iguales a la fuente y sin citas textuales.
      > 4) Sin markdown, salvo los subtítulos «## ». Sin listas, negritas, links ni emojis.
      > 5) El título es claro, sin sensacionalismo, de hasta 90 caracteres y con mayúscula solo al inicio y en nombres propios.
      > 6) El resumen tiene 1 o 2 oraciones, entre 110 y 180 caracteres.
      > 7) Nunca mencione GoHighLevel, HighLevel ni GHL. No mencione a Bralto ni venda servicios.
      > 8) escena_imagen describe en inglés una escena visual editorial y abstracta que represente el tema, sin texto, logos ni personas reconocibles. imagen_alt describe esa misma escena en español, en hasta 150 caracteres.
  13. **HTTP `POST {BASE}/api/noticias/validar`** con `{ idioma: 'es', borrador, fuente_url, fuente_nombre, fuente_texto }`.
  14. **HTTP Gemini "Revisar hechos":** `responseSchema { ok: boolean, problemas: string[] }`. Prompt:

      > Compare la nota con la fuente. Es un problema cada cifra, fecha, nombre, producto o afirmación que no esté respaldada por la fuente, cualquier frase casi literal de la fuente y cualquier mención de GoHighLevel. Si no hay problemas, ok=true.
  15. **IF hay problemas** (validar o revisar): HTTP Gemini "Reescribir", con el prompt del paso 12 más "Corrija estos problemas: {lista}. Borrador anterior: {JSON}". Después se repiten los pasos 13 y 14. Si sigue con problemas, Stop and Error con "La nota no pasó la revisión: {problemas}", lo que manda el correo de errores.
  16. **HTTP Gemini "Traducir":** `responseSchema { titulo, resumen, cuerpo, imagen_alt }`. Prompt:

      > Traduzca al inglés de EE. UU., natural y periodístico. Mayúscula solo al inicio y en nombres propios. Los subtítulos son «## Why it matters» y «## What it means for your business». No agregue datos. La fuente original está en inglés: no reproduzca sus frases; si una traducción coincide con la fuente, reformúlela.

      Después `POST /validar` con `idioma: 'en'`. Si falla, se reescribe una vez con los problemas; si vuelve a fallar, Stop and Error.
  17. **HTTP Gemini imagen:** `POST …/models/gemini-3-pro-image:generateContent` con este cuerpo:

      ```
      { contents: [{ parts: [{ text }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9', imageSize: '2K' } } }
      ```

      El `text` es:

      > Editorial cover image, 16:9. {escena_imagen}. Style: dark near-black background (#060607), cinematic soft lighting with a neon orange (#ff6d28) accent light, frosted liquid-glass surfaces, minimal composition with generous empty space in the lower-right corner, premium tech aesthetic, photorealistic 3D render. Strictly no text, letters, numbers, logos, brand marks, UI screenshots or recognizable faces.

      Code saca `candidates[0].content.parts[].inlineData.data`.
  18. **Achicar la imagen:** Convert to File (base64 → binario), Edit Image con resize a 1600×900 en `jpeg` y calidad 90, y Extract from File (binario → base64). Si Edit Image no tiene GraphicsMagick en el servidor, pedir `imageSize: '1K'` en el paso 17 y mandar el PNG en base64 sin achicar; el sitio acepta PNG.
  19. **Code "Estado":**

      ```
      const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' })
      estado = hoy < ENSAYO_HASTA ? 'oculta' : 'publicada'
      ```
  20. **HTTP `POST {BASE}/api/noticias`:** con `{ es, en, fuente_url, fuente_nombre, fuente_texto, imagen_base64, estado }`, timeout de 120 s y la credencial de Bralto.
  21. **Correo con Resend:**
      - Asunto: "Nueva nota: {titulo_es}", o "Ensayo: {titulo_es}" si está oculta.
      - HTML con el título, el resumen, el link (o la vista previa) y el botón de `accion.publicar` o `accion.ocultar`.
      - Al pie, los feeds que fallaron, si hubo.

- [ ] **Step 5: Validar y crear.** Correr `validate_workflow` hasta que no dé errores y crear con `create_workflow_from_code`. Guardar el código en `n8n/` y hacer commit.

- [ ] **Step 6: Probar con pin data.** Usar `prepare_test_pin_data` y `test_workflow` con dos ítems de feed fijos, para recorrer el camino feliz sin cobrar la imagen. Después probar el camino de "no hay candidatas".

- [ ] **Step 7: Corrida real contra el preview** con `execute_workflow`, con `BASE` en el preview y en modo ensayo. Expected:
  - la nota se guarda oculta;
  - llega el correo de ensayo con la vista previa;
  - la portada tiene la firma.

  Mostrarle a Alejandro la nota y la imagen.

- [ ] **Step 8: Activar** con `publish_workflow` (horario de las 6:00). Los 3 días de ensayo corren contra el preview: las notas que Alejandro publique desde el correo quedan `publicada` en la base y aparecen en producción cuando se fusione.

---

### Task 9: Producción

- [ ] **Step 1:** Cuando Alejandro dé el OK a las notas del ensayo:
  1. `gh pr merge <N> --merge`;
  2. esperar el status "Vercel" del commit de merge;
  3. verificar en www.bralto.io: `/es/noticias`, una nota, el menú, `/sitemap.xml` y que la API responda 401 sin header.
- [ ] **Step 2:** Cambiar `BASE` del workflow a `https://www.bralto.io` con `update_workflow`, desde `n8n/noticias-ia-diarias.js`, y hacer commit en main con su PR.
- [ ] **Step 3:** Actualizar la memoria del proyecto: workflows, ids, credenciales, `ENSAYO_HASTA` y trampas.
