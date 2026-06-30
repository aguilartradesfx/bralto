# Bralto — Sistema de contenido social + línea gráfica

**Fecha:** 2026-06-30
**Estado:** Aprobado (línea gráfica validada con spike real). Listo para plan de implementación.
**Autor:** Ale + Claude

---

## 1. Objetivo y contexto

Producir contenido de redes sociales para **Bralto** (bralto.io) que posicione a la
agencia como **autoridad en implementación de IA**, nutriendo a la audiencia con
información de valor para, eventualmente, atraer clientes potenciales.

- **Nicho meta:** dueños de agencias que quieren aprender a usar la IA para
  implementarla en sus negocios o en los de sus clientes.
- **Idioma / mercado:** Español (LatAm). Tono cercano pero profesional.
- **Plataformas:** todas (IG, FB, etc.) vía **GHL Social Planner**. Formato único
  **3:4 vertical** (1080×1440) para que sirva en todas.
- **Distribución:** las cuentas IG/FB ya están conectadas en el Social Planner de GHL.

## 2. Pilares de contenido

Los cuatro, rotando a lo largo del mes:

1. **Herramientas / Tutoriales IA** — reviews y cómo-usar de herramientas concretas
   (Claude, n8n, GHL, APIs, Skills). Capturas de procesos. Muy "guardable".
2. **Casos y resultados** — qué implementamos y qué logró (ej. agente de prospección
   LinkedIn). Prueba social = autoridad.
3. **Errores / Mitos de IA** — qué hacen mal las agencias, mitos, advertencias.
   Genera debate y comentarios.
4. **Frameworks / Conceptos** — marcos mentales: cómo pensar la automatización, dónde
   empezar, ROI, pricing. Posiciona como estratega, no solo técnico.

## 3. Línea gráfica — Dirección C: "Sistema Híbrido"

Decisión tomada tras analizar 57 referencias y comparar 3 direcciones renderizadas.
Anclada a la identidad de Bralto, con **acento ÚNICO naranja** (no multicolor) como
ventaja de marca diferenciadora.

### 3.1 Tokens

| Token | Valor | Uso |
|---|---|---|
| Negro | `#0d0d0d` | Fondo de portadas y slides oscuras |
| Crema | `#F4F1EA` | Fondo de slides interiores (legibilidad) |
| Acento | `#FF6A00` (orange-500) | Único color de acento, en todo |
| Tinta | `#0d0d0d` / `#FFFFFF` | Texto sobre crema / sobre negro |
| Tipografía | Helvetica Neue | 800 titulares (tracking −2.4) · 500 cuerpo |

### 3.2 Taxonomía de slides

- **Portada (oscura + imagen IA):** base generada por IA con espacio negativo +
  titular gancho + pill de pilar + lockup `bralto.` + swipe `››`. *(validada en spike)*
- **Interior (crema, legible):** cards redondeadas, patrón ✅ "haz esto" / ❌ "no esto",
  pasos numerados, números de error. Estilo editorial tipo sifuyik. Máxima legibilidad.
- **Prompt-showcase (oscura):** grilla de resultados de IA + el prompt exacto en
  monoespaciada. Formato propio para el pilar Herramientas.
- **Cierre / CTA (oscura):** recap + llamada a la acción (guardar / comentar una
  palabra / seguir / DM).

### 3.3 Elementos de marca recurrentes

- Barra / acento naranja lateral.
- Contador de slide (`1/7`).
- Lockup `bralto.` (punto en naranja).
- Affordance de swipe `››`.
- Pill de pilar: un emoji + label, consistente por pilar.

### 3.4 Refinamientos a integrar (del spike → sistema)

- Titular ~15% más grande y subido; reducir el aire muerto entre subtítulo y footer.
- Sujeto de la imagen IA un poco más arriba para ampliar la zona limpia.
- Añadir contador de slide y la barra naranja lateral.
- **Separar los textos del borde inferior** (footer con ~88px de margen, no pegado).
  Aplicado en `compose.mjs` (v2) y aprobado por Ale.

## 4. Pipeline de producción (validado)

Flujo **100% reproducible por código**, sin Canva ni navegador:

1. **Imagen base IA** → `scripts/social/gen-base.mjs`
   - Motor: **Google Gemini "Nano Banana Pro"** (`gemini-3-pro-image-preview`), vía
     `generateContent` con `imageConfig: { aspectRatio: "3:4", imageSize: "2K" }`.
     Devuelve 1792×2400 (3:4 exacto).
   - Soporta OpenAI `gpt-image-1` como alternativa (flag `--provider openai`), **pero
     desactivado por ahora**: la cuenta OpenAI devolvió `billing_hard_limit_reached`.
     **Decisión: Gemini-only** hasta cargar saldo en OpenAI.
   - "Receta" de prompt parametrizable: negro `#0d0d0d` + glow **solo naranja** +
     sujeto en mitad superior + **45% inferior limpio** para texto + **sin texto/letras**.
2. **Composición de texto** → `scripts/social/compose.mjs`
   - `sharp` + overlay SVG (Helvetica Neue del sistema). Resize a 1080×1440 + scrim
     inferior para garantizar contraste. Sin headless browser.
3. **Salida:** PNG 1080×1440 listo para subir.
4. **(Sub-proyecto futuro) Distribución:** subir + agendar al GHL Social Planner vía la
   API `/social-media-posting/{locationId}/posts` (acepta varias cuentas a la vez),
   reutilizando `lib/ghl/client.ts` (`ghlFetchLocation`, tokens en Supabase).

### 4.1 Claves de entorno

`OPENAI_API_KEY` y `GEMINI_API_KEY` añadidas a `.env.local` y `.env.example`. Los
scripts se corren con `node --env-file=.env.local`.

## 5. Plan de contenido — 20 posts/mes

**Cadencia:** 5 posts/semana (L–V) × 4 semanas = **20 posts**. Mayoría carruseles
(12 carruseles + 8 singles). Profundidad > frecuencia para un juego de autoridad.

**Volumen de imágenes:** ~80 slides en total, de las cuales **solo ~26 requieren IA**
(portadas + prompt-showcases + singles); los interiores crema son código puro.

| # | Día | Formato | Pilar | Tema |
|---|---|---|---|---|
| **S1 — Quick wins** | | | | |
| 1 | Lun | Carrusel | Herramientas | Usar Claude para escribir propuestas de agencia en 10 min |
| 2 | Mar | Single | Mito | "La IA reemplaza a tu agencia" → reemplaza a las que NO la usan |
| 3 | Mié | Carrusel | Framework | Cómo decidir qué automatizar primero en tu agencia |
| 4 | Jue | Single | Tip | 1 prompt para auditar el copy de cualquier landing |
| 5 | Vie | Carrusel | Caso | El agente de prospección LinkedIn que agenda reuniones solo |
| **S2 — Automatización** | | | | |
| 6 | Lun | Carrusel | Herramientas | n8n para agencias: automatiza el onboarding (paso a paso) |
| 7 | Mar | Single | Error | El error #1: automatizar sin mapear el proceso |
| 8 | Mié | Carrusel | Framework | Dónde está el dinero de la IA: las 5 capas de tu agencia |
| 9 | Jue | Single | Herramienta | GHL + IA: responder leads en 30 seg, 24/7 (captura) |
| 10 | Vie | Carrusel | Caso | De 8h a 20 min: automatizamos los reportes de un cliente |
| **S3 — Contenido / Entrega** | | | | |
| 11 | Lun | Carrusel | Herramientas | Nano Banana Pro: tu línea gráfica con IA (meta: este proceso) |
| 12 | Mar | Single | Mito | No necesitas programar; necesitas saber qué problema resolver |
| 13 | Mié | Carrusel | Framework | El stack de IA mínimo para una agencia en 2026 |
| 14 | Jue | Single | Tip | 3 prompts para crear 1 mes de contenido en una tarde |
| 15 | Vie | Carrusel | Caso | Cómo una agencia de 3 entrega como una de 10 (con IA) |
| **S4 — Escala / Negocio** | | | | |
| 16 | Lun | Carrusel | Herramientas | Construye un Skill que haga el trabajo aburrido de tu agencia |
| 17 | Mar | Single | Error | Vender "IA" es un error: vende el resultado (tiempo, leads, margen) |
| 18 | Mié | Carrusel | Framework | Cómo cobrar servicios de IA sin regalar tu trabajo (pricing) |
| 19 | Jue | Single | Herramienta | Herramienta para transcribir y resumir reuniones de cliente |
| 20 | Vie | Carrusel | Cierre | Lo que aprendimos automatizando nuestra propia agencia |

Los temas son un punto de partida editable; el copy fino de cada slide se redacta en
la fase de producción.

## 6. Enfoque de ejecución

1. **Validar Semana 1 completa** (5 posts) de punta a punta: generar bases, componer,
   revisar, afinar plantillas/recetas.
2. Una vez fina la S1, **producir en lote** las semanas 2–4.
3. Subir/agendar al GHL Social Planner (sub-proyecto de distribución).

Evita generar 80 imágenes antes de confirmar que el sistema quedó fino.

## 7. Componentes a construir (resumen para el plan de implementación)

- `scripts/social/gen-base.mjs` — generador de base IA *(existe, validado)*.
- `scripts/social/compose.mjs` — composición de texto con sharp *(existe, validado)*.
- **Sistema de plantillas de slides** parametrizable (portada, interior crema,
  prompt-showcase, cierre) con los tokens y elementos de marca §3.3.
- **Definición de copy** por post (gancho, slides, CTA) para los 20.
- **Banco de "recetas" de imagen IA** por tema/sujeto.
- *(Futuro)* `lib/ghl/social.ts` — posteo al Social Planner + endpoint/CLI para agendar.

## 8. Decisiones y temas abiertos

- **Resuelto:** Dirección C; acento mono-naranja; Gemini-only; 3:4; 20 posts; mayoría
  carruseles; validar S1 antes del lote.
- **Abierto:** confirmar los IDs de cuentas/location de GHL para la distribución
  (se obtienen por API o los pega Ale); decidir si se cargan créditos a OpenAI.
- **Fuera de alcance ahora:** video/Reels; versión en inglés; analítica de rendimiento.
