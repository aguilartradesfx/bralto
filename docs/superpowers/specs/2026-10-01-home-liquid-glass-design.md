# Home nuevo de bralto.io: liquid glass monocromo

**Fecha:** 2026-10-01 · **Estado:** plan corto aprobado por Alejandro en el chat; este documento registra las decisiones.
**Fuente de verdad del contenido:** `INSTRUCCIONES-CLAUDE-CODE-home-bralto.md` y el copy de `bralto-home-liquid-glass.html` (solo el texto; lo visual es libre).

## Objetivo

Reemplazar el home de `/es` y `/en` por el copy aprobado y un estilo liquid glass monocromo, con componentes propios. Mientras se itera, el home nuevo vive en el preview de Vercel de la rama `feat/home-liquid-glass`. Producción no cambia hasta que se apruebe y se fusione la rama.

## Decisiones

1. **Tema limitado al home.** El resto del sitio es solo oscuro (`<html class="dark">` fijo y texto blanco fijo en las demás páginas). El home usa un atributo propio `data-theme` en su contenedor, que aplica un script inline antes del primer pintado: preferencia guardada → si no hay, `prefers-color-scheme`. No se usa `next-themes`, porque escribe en `<html>` y rompería las demás páginas al navegar.
2. **Fondo propio.** El home tapa las capas globales `atmo-ambient`/`atmo-grid` (cian/ámbar) con su fondo monocromo. También neutraliza la barra de scroll cian mientras está montado.
3. **Nav.** Links a secciones, selector ES/EN, toggle de tema y CTA. Servicios y Sobre nosotros pasan al footer. Las demás páginas mantienen su nav y estilo actuales.
4. **Placeholders.** Los bloques con datos pendientes (casos, testimonios, link a la comunidad) se ven en desarrollo y en previews de Vercel, y se ocultan solo en producción (`VERCEL_ENV === 'production'`, o `NODE_ENV === 'production'` fuera de Vercel). El link "Casos" del nav se oculta con su sección.
5. **Acento:** `#ff6d28`, el naranja de marca que ya usa el sitio, solo como micro-acento.
6. **Ids conservados:** `inicio`, `como-funciona`, `plataforma`, `casos-reales`, porque el nav y el footer de las otras páginas enlazan a ellos.

## Dirección visual

- **La señal.** El naranja tiene un solo significado: un lead moviéndose por el sistema. Aparece en el punto que recorre el hero y el circuito, en los nodos encendidos, en "En vivo", en el check de la garantía y en el foco. Todo lo demás es monocromo.
- **Vidrio con grosor.** Paneles esmerilados con filo de luz superior, borde que capta la luz de forma desigual y orientado hacia el cursor, reflejo especular que sigue al cursor (solo `pointer: fine`) y sombras amplias. En Chromium, las piezas principales pueden sumar refracción real en el borde, con degradación al esmerilado normal.
- **Hero: el sistema funcionando.** Titular a lo ancho (300 vs 600) y, debajo, una consola de vidrio con las 4 estaciones del ejemplo (lead nuevo, agente IA, cita, venta). Un punto recorre la línea y enciende cada estación con su tiempo. Es CSS puro, sin JS. Con movimiento reducido queda quieta y todo encendido.
- **Comparativa:** lo de "casi todos" queda tachado sobre el fondo y lo de 2027, sobre una placa de vidrio elevada. El tachado se dibuja con el scroll.
- **Circuito "Su sitio web es solo la puerta":** el sitio en el centro y las 6 capas en anillo, porque Optimizar vuelve a Atraer. El punto recorre el anillo con el scroll y enciende cada nodo. En móvil es una columna con línea vertical.
- **Plataforma:** la tabla de herramientas como recibo; cada precio se tacha y cierra con "Incluido en su sistema".
- **Toggle glossy:** pieza negra brillante cuya perilla se estira a mitad de camino. El cambio de tema usa View Transitions cuando el navegador lo soporta.

## Arquitectura

- `components/home/`: secciones (server components salvo nav, toggle y reflejo), `home.css` con tokens de ambos temas, vidrio y fallbacks, y fuentes Sora + JetBrains Mono con `next/font`, cargadas solo en el home.
- `lib/home/`: lógica pura con tests (visibilidad de pendientes, script de tema, paridad de textos ES/EN).
- Textos en el namespace `Home` de `messages/es.json` y `messages/en.json`. El inglés es borrador hasta que se apruebe.
- Metadata propia del home (title y description nuevos) en `app/[locale]/page.tsx`. El título por defecto del layout no cambia.
- Apariciones con scroll vía CSS (`animation-timeline: view()`) como mejora progresiva: sin soporte, el contenido simplemente se ve.

## Accesibilidad y rendimiento

- Contraste AA en ambos temas. Foco visible en naranja. El toggle usa `aria-pressed` y label. La FAQ usa `<details>` nativo.
- `prefers-reduced-motion` apaga las animaciones, `prefers-reduced-transparency` quita el blur, y hay fondo sólido si no existe `backdrop-filter`.
- Máximo 2 niveles de vidrio con `backdrop-filter`, con blur menor en móvil. Se anima solo `transform` y `opacity`. Los orbes usan gradientes radiales, no `filter: blur`.
- Metas: Lighthouse móvil Performance ≥ 85, Accessibility ≥ 95, CLS < 0.1. Sin scroll horizontal a 360 px.

## Al sustituir el home (antes de fusionar)

- Borrar los componentes que solo usaba el home viejo: `hero`, `ui/typewriter`, `ui/logo-cloud`, `ui/infinite-slider`, `how-it-works`, `robot-section`, `platform-section`, `guarantee-section`, `pricing-section`, `testimonials-section`, `ui/testimonials-columns`, `faq-section` y `final-cta`, junto con sus namespaces. Se conserva `PlatformSection`, que usa `/plataforma`.
- `funnel-viz-section` y `funnel-lab-section` salen del home; sus archivos se quedan hasta que Alejandro decida dónde van.
- Confirmar el copy pendiente y la traducción al inglés.

## Copy abierto (no se cambia sin aprobación)

- La garantía menciona "su mensualidad", pero la página no menciona ninguna mensualidad.
- ~~"Cada peso que usted invierte"~~ Resuelto el 2026-10-02: el subtítulo del hero pasa a ser "Construimos e integramos sistemas inteligentes a la medida que automatizan toda su operación comercial." (definido por Alejandro). La meta description usa la misma frase.
- URL de la comunidad (hoy `#`; el link se oculta hasta tenerla).
- Respuestas de la FAQ marcadas como borrador en el HTML.
- Title y meta description nuevos (propuestos en `messages/*.json`, `Home.meta`).

## Diagnóstico pagado ($97) — 2026-10-05

Aprobado por Alejandro en el chat ("Todo bien" a la propuesta).

- **Cuenta:** Stripe "Alejandro Aguilar" (`STRIPE_SECRET_KEY`). Claves de prueba en desarrollo y preview; las live las carga Alejandro en Vercel (Production).
- **Flujo:** el visitante elige horario (retención en Redis) → datos → preguntas → paga $97 USD en Stripe Checkout (el horario queda retenido ~31 min, lo mismo que dura la sesión de pago) → confirmación.
- **Confirmación idempotente** desde la página de éxito (`/confirmacion?session_id=…`) y desde el webhook (`checkout.session.completed`, `product_kind = diagnostic`). Lo que llegue primero confirma; el otro no repite nada.
- **Términos** (palabras de Alejandro): si contrata el servicio, los $97 se descuentan del proyecto; si no, no son reembolsables. Sin plazo y sin promesa de reprogramación o reembolso por cancelación (no definidos).
- **Modo prueba:** un pago de prueba no crea la cita en el calendario real ni escribe en Supabase, y usa claves de Redis separadas.
- **Textos:** todo lo que en el sitio decía que la llamada era gratis pasa a reflejar el pago.
- **Para producción:** claves live de la cuenta nueva, endpoint de webhook en esa cuenta y recrear ahí el precio del plan de $87 (`/plataforma`), que hoy vive en la cuenta anterior.
