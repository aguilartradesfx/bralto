# Noticias de IA en bralto.io, publicadas solas

**Fecha:** 2026-10-09 · **Estado:** plan aprobado por Alejandro en el chat (con sus respuestas a las 4 preguntas); este documento registra las decisiones.

## Objetivo

Publicar una nota diaria sobre IA en bralto.io, en español y en inglés, con imagen generada, sin intervención humana. La nota está firmada por Alejandro Aguilar, CEO Bralto, y explica qué pasó, por qué importa y qué significa para un negocio. Está pensada para dueños de negocio en Latinoamérica.

## Decisiones

1. **n8n hace el trabajo; el sitio publica.** n8n lee los feeds, elige, escribe, revisa, traduce, genera la imagen y avisa. El sitio tiene una sola entrada protegida que valida la nota, pone la firma en la imagen, la sube y la guarda. Así:
   - la llave de Supabase vive solo en Vercel;
   - la firma usa la tipografía del sitio;
   - las reglas de la nota están en código con pruebas.
2. **Avisos por correo con Resend** a `aguilartradesfx@gmail.com`, desde `Bralto Noticias <noticias@send.bralto.io>`. Hay un correo por publicación, otro por cada día sin nota (con el motivo) y otro por cada error. Si un día no llega nada, algo está caído.
3. **Ensayo de 3 días.** Desde que se activa el flujo, las notas se guardan ocultas. El correo trae una vista previa y un botón **Publicar**. Después pasan a publicarse solas, y el correo trae un botón **Ocultar**. El flujo cambia de modo solo, por fecha (`ENSAYO_HASTA`).
4. **Enlace "Noticias"** en el menú principal (escritorio y móvil) y en el pie de página.
5. **Aviso de IA al pie de cada nota:** "Redactada con apoyo de inteligencia artificial a partir de la fuente citada." / "Written with the help of artificial intelligence, based on the cited source."
6. **Rutas en español en los dos idiomas**, como el resto del sitio: `/es/noticias`, `/es/noticias/<slug>`, `/en/noticias`, `/en/noticias/<slug>`. Las dos versiones de una nota comparten el slug, que sale del título en español.
7. **Nunca se menciona GoHighLevel.** Lo dice el prompt y además el código rechaza la nota si aparece "GoHighLevel", "HighLevel", "Go High Level" o "GHL".
8. **Modelos:**
   - **Texto:** `gemini-3.1-pro-preview`. El Pro solo existe en versión preliminar; si Google lo retira, el flujo falla y avisa.
   - **Imagen:** Nano Banana Pro, `gemini-3-pro-image`, en versión estable. Formato 16:9 y tamaño 2K.
   - Los dos IDs se verificaron en la API de Gemini el 2026-10-09.

## Fuentes (15, verificadas el 2026-10-09)

**Oficiales:**
- OpenAI `openai.com/news/rss.xml`
- Anthropic: no tiene RSS oficial. Se usa el espejo comunitario `raw.githubusercontent.com/Olshansk/rss-feeds/main/feeds/feed_anthropic_news.xml`.
- Google, The Keyword IA `blog.google/technology/ai/rss/`
- Google DeepMind `deepmind.google/blog/rss.xml`
- Meta Newsroom `about.fb.com/news/feed/`
- Microsoft `blogs.microsoft.com/feed/`
- NVIDIA `blogs.nvidia.com/feed/`
- Hugging Face `huggingface.co/blog/feed.xml`

**Medios:**
- TechCrunch IA `techcrunch.com/category/artificial-intelligence/feed/`
- The Verge IA `theverge.com/rss/ai-artificial-intelligence/index.xml`
- Ars Technica IA `arstechnica.com/ai/feed/`
- MIT Technology Review IA `technologyreview.com/topic/artificial-intelligence/feed`
- Wired IA `wired.com/feed/tag/ai/latest/rss`
- The Decoder `the-decoder.com/feed/`
- Xataka IA `xataka.com/tag/inteligencia-artificial/rss2.xml`

**Descartadas:**
- VentureBeat: responde 429.
- Microsoft AI blog: responde 410.
- Bloomberg Línea: publica poco.
- AWS ML, Google Research y Apple ML: son tutoriales o investigación.

## Flujo diario en n8n (6:00 am, `America/Costa_Rica`)

1. **Leer los 15 feeds.** Si uno falla, el resto sigue y el correo dice cuál falló. Solo quedan los ítems de las últimas 24 h.
2. **Descartar lo ya usado.** Se pide al sitio la lista de links de fuente ya guardados, incluidas las notas ocultas, y los títulos de los últimos 14 días. Se quitan los links repetidos. Los títulos van al paso 3 para no repetir un tema que cubrió otro medio.
3. **Elegir.** Gemini devuelve hasta 3 candidatas en orden, con el porqué, o `publicar: false` con el motivo. El criterio es la relevancia para dueños de negocio en Latinoamérica. Sin candidatas se manda el correo "hoy no se publicó" y termina.
4. **Leer la fuente completa.** Primero se lee la página directo. Si falla o trae poco texto (OpenAI responde 403), la lee Gemini con `url_context`. Si tampoco funciona, se pasa a la candidata siguiente. Si ninguna se puede leer, se manda el correo "hoy no se publicó".
5. **Escribir en español** (JSON): título, resumen, cuerpo de 400 a 600 palabras, texto alternativo de la imagen y la escena para la imagen. El cuerpo explica qué pasó, por qué importa y qué significa para un negocio. Está prohibido copiar frases de la fuente.
6. **Revisar.** El sitio valida las reglas de la sección *Reglas de la nota*. Gemini compara la nota con la fuente: cada cifra, nombre y fecha tiene que estar en la fuente. Si hay problemas, se reescribe una sola vez con esa lista. Si vuelve a fallar, no se publica y llega el correo de error.
7. **Traducir al inglés** el título, el resumen, el cuerpo y el texto alternativo. El sitio vuelve a validar.
8. **Generar la imagen** con Nano Banana Pro, en 16:9 y sin texto. El estilo base es el de Bralto:
   - Fondo casi negro, luz naranja `#ff6d28` y superficies de vidrio.
   - Composición minimalista y espacio libre abajo a la derecha, donde va la firma.
   - Sin logos de marcas, sin caras reconocibles y sin texto.
   n8n la reduce a JPEG de 1600×900 antes de mandarla, porque Vercel acepta hasta 4.5 MB por pedido.
9. **Publicar.** Se manda todo a `POST /api/noticias` con `estado = oculta` durante el ensayo y `publicada` después.
10. **Avisar** por Resend: título, link y botón Publicar u Ocultar.
11. **Errores:** un workflow aparte con Error Trigger manda el correo con el paso, el mensaje y el link a la ejecución. La nota solo se guarda en el último paso, así que un fallo antes no publica nada.

## Supabase

- **Tabla `noticias`:**

  | Columna | Detalle |
  |---|---|
  | `id` | uuid |
  | `slug` | único |
  | `titulo_es`, `resumen_es`, `cuerpo_es` | |
  | `titulo_en`, `resumen_en`, `cuerpo_en` | |
  | `imagen_alt_es`, `imagen_alt_en` | |
  | `fuente_url` | único |
  | `fuente_nombre` | |
  | `imagen_url` | |
  | `publicada_en` | la fecha |
  | `estado` | `publicada` / `oculta` |
  | `creada_en`, `actualizada_en` | |

- **RLS:** el público, con la clave anónima, solo lee las filas con `estado = 'publicada'`. Escribe solo la service role desde el sitio.
- **Bucket público `noticias`:** las imágenes van en `<año>/<slug>.jpg`.
- **Ocultar es inmediato.** Las páginas de noticias y el sitemap se arman en cada visita, sin caché. Cambiar `estado` a `oculta` saca la nota del listado, de su página (404) y del sitemap. Se puede ocultar desde el editor de tablas de Supabase o con el botón del correo. La imagen sigue en el bucket.

## Sitio

- **`lib/news/`, lógica pura con pruebas:**
  - validación de la nota;
  - detector de frases copiadas;
  - slug;
  - lector del cuerpo (párrafos y subtítulos `## `, sin HTML ni links);
  - tokens firmados de los links del correo.
- **Imagen:** `sharp` compone la imagen. La firma "Alejandro Aguilar · CEO Bralto" se dibuja con `next/og` en Sora (la fuente del sitio, licencia OFL, archivo en el repo) y va pequeña abajo a la derecha, sobre un degradado oscuro suave. Sale en JPEG de 1600×900.
- **API** (todas con el header `x-api-key: NEWS_API_KEY`, salvo la de estado):
  - `GET /api/noticias/recientes`: links de fuente usados y títulos de los últimos 14 días.
  - `POST /api/noticias/validar`: devuelve `{ ok, problemas[] }` sin guardar nada.
  - `POST /api/noticias`: valida, compone y sube la imagen y guarda la fila. Si la fila falla, borra la imagen. Devuelve los links pública, de vista previa y de acción. Un link de fuente repetido da 409.
  - `GET|POST /api/noticias/estado?id=…&accion=publicar|ocultar&t=…`: GET muestra una confirmación con un botón; POST cambia el estado. El paso intermedio existe porque los correos abren los links solos. El token es HMAC con `NEWS_LINK_SECRET`.
- **Páginas:**
  - `/[locale]/noticias`: listado, 24 por página.
  - `/[locale]/noticias/[slug]`: imagen, título, fecha, autor (Alejandro Aguilar, CEO Bralto, con foto y link a Sobre nosotros), resumen, cuerpo, recuadro con el nombre de la fuente y su link, aviso de IA y cierre hacia /agendar.
  - Con `?vista=<token>` una nota oculta se ve, con un aviso de vista previa y `noindex`.
- **Metadatos:**
  - title, description y canonical, con el otro idioma enlazado;
  - Open Graph `article` con la imagen 1600×900, `publishedTime` y autor;
  - Twitter `summary_large_image`;
  - JSON-LD `NewsArticle` con autor `Person` (jobTitle CEO, worksFor Bralto), publisher Bralto e `isBasedOn` apuntando a la fuente.
- **Sitemap:** `/noticias` y cada nota publicada, con su fecha.
- **Variables nuevas:** `NEWS_API_KEY` y `NEWS_LINK_SECRET` en `.env.local` y en Vercel (production y preview).

## Reglas de la nota (las valida el sitio)

- **Cuerpo en español:** de 400 a 600 palabras. **En inglés:** de 340 a 690.
- **Título:** hasta 110 caracteres. **Resumen:** de 80 a 200 caracteres, porque se usa como meta description.
- **Formato del cuerpo:** solo párrafos separados por una línea en blanco y subtítulos `## `. Sin HTML, sin links y sin otro markdown.
- **Fuente:** `fuente_url` con https y `fuente_nombre` con texto.
- **Términos prohibidos:** ningún campo puede tener los del punto 7 de *Decisiones*.
- **Nada copiado:** la nota no puede repetir 8 palabras seguidas de la fuente, ni en español ni en inglés (casi todas las fuentes están en inglés). Antes de comparar se pasa todo a minúsculas y se quitan los acentos y la puntuación.

## n8n

- **Workflows** (creados por MCP, con "Available in MCP" activado):
  - "Bralto · Noticias IA diarias";
  - "Bralto · Noticias IA · errores", que es el `errorWorkflow` del primero.
- **Credenciales** (por la API REST):
  - Gemini, del tipo `googlePalmApi`;
  - Resend, como header `Authorization: Bearer …`;
  - Bralto, como header `x-api-key`.

## Pruebas y verificación

- **Pruebas unitarias** (`npm test`) de todo `lib/news/`. Cada regla tiene un caso que la rompe.
- **API:** se prueba en local y en el preview de Vercel con una nota de prueba oculta, que después se borra.
- **n8n:** primero con datos fijos (pin data); después, una corrida real en modo ensayo contra producción, con la nota oculta y el correo con el botón Publicar.
- **Páginas:** revisión visual en escritorio y móvil, en tema claro y oscuro, y de los metadatos (Open Graph y JSON-LD).

## Costo estimado

Unos USD 10 al mes: alrededor de $0.13 por imagen y $0.20 de texto por día, con precios de la API de Gemini.
