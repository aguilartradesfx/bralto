# Brief técnico: Sistema de Contratos Bralto

> Este documento es el encargo para Claude Code. Describe qué construir, cómo estructurar la base de datos en Supabase, qué rutas crear, y cómo debe comportarse el renderizado del contrato.

## Resumen ejecutivo

Construir un módulo interno de generación, almacenamiento y firma de contratos Bralto. Debe permitir:

1. Crear contratos desde un formulario con campos editables + checkboxes de servicios
2. Almacenar todo en Supabase (un contrato = una fila en tabla `contracts`)
3. Generar un **enlace público único** por contrato para que el cliente lo firme
4. Firma visual en canvas + checkbox de aceptación + captura de timestamp/IP/user-agent
5. Listar todos los contratos por cliente con filtros de estado (draft, sent, viewed, signed, etc.)

---

## Stack asumido

- **Frontend:** Next.js 14+ (App Router) + Tailwind + TypeScript (ya es el stack de bralto.io)
- **Backend:** Supabase (Postgres + Auth + RLS + Storage)
- **Renderizado del contrato:** Handlebars o Mustache (la plantilla ya usa sintaxis `{{var}}` y `{{#if}}...{{/if}}`)
- **Canvas de firma:** `react-signature-canvas`
- **Generación de PDF firmado:** `@react-pdf/renderer` o `puppeteer` en API route
- **Validación de forms:** Zod + react-hook-form

---

## Esquema de Supabase

### Tabla `contracts`

```sql
create table contracts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- slug público, ej: 'american-outlet-a7k3'
  status text not null default 'draft', -- draft | sent | viewed | signed_by_client | signed_fully | cancelled

  -- Toda la data editable del formulario va en un JSONB. Ver contract_schema.json
  data jsonb not null,

  -- Referencia al cliente (tabla clients separada, ver abajo)
  client_id uuid references clients(id) on delete restrict,

  -- Evidencia de firma (se rellena cuando el cliente firma)
  signature_client_data text,          -- Data URL base64 del canvas
  signature_client_timestamp timestamptz,
  signature_client_ip inet,
  signature_client_user_agent text,
  signature_client_accepted_terms boolean default false,

  signature_bralto_data text,
  signature_bralto_timestamp timestamptz,

  -- Metadata
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,

  -- PDF final generado al firmar (Supabase Storage)
  signed_pdf_url text
);

create index idx_contracts_slug on contracts(slug);
create index idx_contracts_client on contracts(client_id);
create index idx_contracts_status on contracts(status);
```

### Tabla `clients`

```sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  empresa_nombre text not null,
  cedula_juridica text,
  representante_nombre text,
  correo_notificaciones text,
  notas text,
  created_at timestamptz default now()
);
```

### Tabla `contract_events` (auditoría)

```sql
create table contract_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references contracts(id) on delete cascade,
  event_type text not null,  -- created | sent | opened | viewed | signed | cancelled | downloaded
  metadata jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz default now()
);
```

### Row Level Security (RLS)

- `contracts`: solo usuarios autenticados de Bralto pueden leer/escribir.
- **Excepción crítica:** la ruta pública `/c/[slug]` debe poder leer UN contrato por su slug sin autenticación. Implementar esto con una **función RPC `get_contract_by_slug(slug)`** con `SECURITY DEFINER` que retorne solo los campos necesarios para renderizar (no expone `created_by`, `client_id`, ni otros contratos).
- La firma del cliente debe pasar por una API route del lado servidor (`/api/contracts/[slug]/sign`) que use service role key, no que el cliente público escriba directo a Supabase.

---

## Rutas de la aplicación

### Rutas internas (autenticadas)

| Ruta | Propósito |
|------|-----------|
| `/contratos` | Lista de contratos con filtros por estado y cliente |
| `/contratos/nuevo` | Formulario de creación |
| `/contratos/[id]` | Vista previa + editar + copiar enlace compartible |
| `/contratos/[id]/editar` | Editar contrato en estado `draft` |
| `/clientes` | Gestión de clientes |

### Rutas públicas (sin auth)

| Ruta | Propósito |
|------|-----------|
| `/c/[slug]` | Vista pública del contrato. El cliente lo lee, acepta términos y firma. |
| `/c/[slug]/firmado` | Pantalla post-firma con el PDF descargable |

### API Routes

| Ruta | Método | Propósito |
|------|--------|-----------|
| `/api/contracts` | POST | Crear contrato |
| `/api/contracts/[id]` | PATCH | Editar contrato en draft |
| `/api/contracts/[id]/send` | POST | Marca como `sent`, genera slug si no existe |
| `/api/contracts/[slug]/view` | POST | Marca como `viewed` + registra evento |
| `/api/contracts/[slug]/sign` | POST | Recibe firma + IP + user agent, cambia status a `signed_by_client`, genera PDF |
| `/api/contracts/[id]/pdf` | GET | Descarga PDF firmado |

---

## Lógica de renderizado del contrato

El archivo `contract_template.md` es la fuente de verdad. Para renderizarlo:

1. Cargar el template como string.
2. Calcular flags derivados antes de renderizar:
   ```typescript
   data.servicios.requiere_consumo_ia =
     data.servicios.sistema_llamadas_ia ||
     data.servicios.agente_whatsapp ||
     data.servicios.agente_servicio_cliente ||
     data.servicios.automatizaciones;

   data.servicios.servicios_no_incluye_contenido =
     !data.servicios.produccion_contenido && !data.servicios.gestion_redes;
   ```
3. Compilar con Handlebars:
   ```typescript
   import Handlebars from 'handlebars';
   const tpl = Handlebars.compile(templateString);
   const rendered = tpl(data);
   ```
4. Convertir Markdown → HTML con `react-markdown` o `marked` para la vista en pantalla.
5. Para el PDF final firmado: usar el mismo HTML pasado por Puppeteer con estilos print-friendly.

### Numeración automática de cláusulas

La plantilla ya maneja la numeración condicional cuando la Cláusula Décima Tercera (costos IA) se incluye u omite. **No modificar esta lógica.** Si se añaden nuevas cláusulas condicionales, repensar la numeración.

---

## Formulario de creación

Secciones del formulario, en orden:

### 1. Cliente
Dropdown para seleccionar cliente existente O botón "Nuevo cliente" que abre sub-formulario con todos los campos del bloque `cliente` del schema.

### 2. Proyecto
- Nombre del paquete (texto)
- Vigencia: selector con opciones preset (1 año / 6 meses / servicio único) + opción custom
- Referencias visuales: checkbox

### 3. Servicios activados (CHECKBOXES)
Mostrar los 14 servicios del schema con su `title` legible. Agrupar visualmente:

- **Publicidad y adquisición:** Ads, SEO, Tracking
- **IA y automatización:** Sistema llamadas IA, Agente WhatsApp, Agente servicio cliente, Automatizaciones, CRM
- **Contenido y presencia:** Producción de contenido, Gestión de redes, Email marketing
- **Desarrollo y experiencia:** Sitio web, Activaciones en tienda
- **Otros:** checkbox + textarea si se marca

Al menos un servicio debe estar marcado para poder guardar.

### 4. Entregables (opcional, editable)
Tabla editable. Botón "Generar entregables por defecto" que popula la tabla según los servicios marcados (ej: si `produccion_contenido = true`, sugiere filas vacías para "Flyers", "Reels", etc.).

### 5. Precio y pago
- Monto inicial (número) → campo auto-traducido a letras con helper (librería `numero-a-letras` para español)
- Checkbox: "Incluye mensualidad"
- Si marcado: monto mensual (número) → letras

### 6. Vista previa
Renderiza el contrato en vivo a la derecha del formulario mientras se edita.

### 7. Botones
- **Guardar borrador** → status `draft`
- **Generar enlace compartible** → status `sent`, genera slug único (`slugify(empresa_nombre) + '-' + nanoid(4)`)

---

## Página pública de firma `/c/[slug]`

### Layout

- Header con logo Bralto (dark header orange gradient, estilo establecido)
- Contenido del contrato renderizado (blanco sobre fondo claro, tipografía serif/sans pair de Bralto)
- Sticky bottom bar con:
  - Checkbox obligatorio: "He leído y acepto los términos de este contrato"
  - Canvas de firma (react-signature-canvas, 500x200px)
  - Botón "Limpiar" firma
  - Botón "Firmar y enviar" — deshabilitado hasta que checkbox + firma no vacía

### Al firmar:

1. Capturar: canvas `toDataURL('image/png')`, timestamp ISO, IP (desde headers en API route), user-agent
2. POST a `/api/contracts/[slug]/sign`
3. La API:
   - Valida que el contrato exista y esté en status `sent` o `viewed`
   - Guarda la evidencia en la fila
   - Cambia status a `signed_by_client`
   - Genera el PDF con la firma insertada (Puppeteer)
   - Sube el PDF a Supabase Storage
   - Envía email al cliente con copia del PDF y a `cs@bralto.io` con notificación
4. Redirige a `/c/[slug]/firmado` con mensaje de confirmación y botón de descarga

### Captura de IP

En Next.js App Router:
```typescript
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
  // ...
}
```

---

## Archivos entregados

Tres archivos en este directorio:

1. **`contract_template.md`** — plantilla Handlebars del contrato. Fuente de verdad legal.
2. **`contract_schema.json`** — JSON Schema completo del objeto `data` que va en la columna `contracts.data`. Usar como base para tipos TypeScript y validación Zod.
3. **`brief_tecnico.md`** — este documento.

---

## Prioridades de implementación

**Fase 1 (MVP):** Tablas + formulario creación + render del contrato + página pública + firma canvas + evidencia. Sin PDF.

**Fase 2:** Generación de PDF firmado + email + Storage.

**Fase 3:** Listado con filtros, clientes reutilizables, entregables auto-sugeridos, dashboard de estados.

**Fase 4:** Plantillas de paquete (ej: "Paquete Retail 360" pre-rellena servicios + entregables por defecto).

---

## Consideraciones legales importantes

- La firma electrónica visual + evidencia (IP, timestamp, user-agent, aceptación explícita) tiene **validez probatoria** en Costa Rica bajo la Ley 8454 de Certificados, Firmas Digitales y Documentos Electrónicos, aunque **no equivale a firma digital certificada**. La Cláusula de "Libre Consentimiento y Firma Electrónica" del contrato deja expresamente establecido este consentimiento mutuo, lo que fortalece la validez.
- Para contratos de alto valor (>$10K) se recomienda ofrecer al cliente la opción de firma digital certificada paralela (fuera de este sistema).
- **Nunca exponer `client_id`, `created_by`, ni datos de otros contratos** en la ruta pública `/c/[slug]`. La función RPC debe filtrar estrictamente.

---

## Notas finales para Claude Code

- Respetar el stack y convenciones existentes de bralto.io (Next.js + Tailwind + TypeScript + Framer Motion).
- Mantener el aesthetic oscuro/naranja en el panel interno y el aesthetic claro/profesional en la vista pública del contrato (el contrato debe verse sobrio, no "marketing").
- El template usa sintaxis Handlebars. Si se prefiere otra (LiquidJS, EJS), traducir antes de compilar.
- Toda la lógica condicional del contrato está en el template — no duplicarla en el frontend.
- El archivo `contract_template.md` puede (y debe) versionarse en Git. Cada cambio mayor → nueva versión. Considerar guardar `template_version` en la tabla `contracts` para que contratos viejos se rendericen con la plantilla con la que fueron creados.
