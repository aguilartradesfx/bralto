# Workflows de n8n de Bralto

Código del SDK de n8n (`@n8n/workflow-sdk`) de los workflows que publican en `/noticias`. Es la
fuente de verdad: los cambios se hacen aquí y después se aplican a n8n.

| Archivo | Workflow | Id | Cuándo corre |
|---|---|---|---|
| `noticias-ia-diarias.js` | Bralto · Noticias IA diarias | `K0B1lsgU6cxPgtE5` | 6:00 y 6:45 (Costa Rica) |
| `articulos-bralto.js` | Bralto · Artículo diario | `HJ2lIE182IFmr61P` | 12:00 y 12:45 (Costa Rica) |
| `noticias-ia-errores.js` | Bralto · Noticias IA · errores | `Sozkuqz4tak7yqqA` | Cuando falla uno de los dos |

## Qué hace cada uno

**Noticia diaria.**
1. Lee 15 feeds.
2. Gemini califica de 0 a 100 las noticias de las últimas 24 h y solo pasan las de 75 o más.
3. Gemini escribe un borrador y GPT (`chat-latest`, el más conversacional) lo reescribe con más impacto.
4. El sitio valida las reglas y Gemini revisa los datos contra la fuente.
5. Gemini traduce.
6. Nano Banana Pro genera la portada.
7. Se publica.

**Artículo de Bralto.**
- Cada día toca un tipo, en rotación: guía o caso real, ranking de herramientas, o comparativa de tipos de proveedor con Bralto #1 (sin nombrar agencias reales).
- GPT lo escribe solo con los datos de la ficha de Bralto (nodo Configuración) y Gemini revisa que no invente nada.

**Respaldo.** Si una llamada de texto a Gemini falla después de sus reintentos (pasa seguido por demanda), el mismo pedido lo hace GPT (`gpt-6.1-sol`) y el flujo sigue igual.

**Ensayo.** Hasta `ensayoHasta` (2026-10-13) las notas se guardan ocultas y el correo trae "Publicar". Después salen publicadas y el correo trae "Ocultar".

La corrida de la segunda hora (6:45 o 12:45) solo sigue si la primera no cerró el día. La memoria estática del workflow guarda `ultimoDia` cuando se publica o se avisa que no hubo nota; un error no lo cierra.

## Relleno de fechas pasadas

Cada workflow tiene un webhook protegido con el header `x-api-key` (`NEWS_API_KEY`). Publica una nota con la fecha pedida, sin correos (el workflow de errores tampoco avisa por esas corridas):

```bash
curl -X POST https://bralto-io-n8n.z49dor.easypanel.host/webhook/noticias-relleno \
  -H "x-api-key: $NEWS_API_KEY" -H 'content-type: application/json' -d '{"fecha":"2026-10-05"}'
curl -X POST https://bralto-io-n8n.z49dor.easypanel.host/webhook/articulos-relleno \
  -H "x-api-key: $NEWS_API_KEY" -H 'content-type: application/json' -d '{"fecha":"2026-10-05","tipo":"guia"}'
```

- **Noticias:** se toman las de las 24 h anteriores a las 6:00 de esa fecha. Los feeds de medios solo traen unos días, así que más atrás quedan sobre todo los blogs oficiales.
- **Artículos:** `tipo` admite `guia`, `herramientas` o `proveedores`.

## Cómo aplicar cambios

- **Solo el código de nodos Code:** `node n8n/sync-code.mjs <archivo> <id>`. Sube el `jsCode` de cada nodo Code y deja todo lo demás como está.
- **Nodos, conexiones u opciones:**
  1. Armar el JSON con `parseWorkflowCode` de `@n8n/workflow-sdk` (sin la línea `import`).
  2. Hacer `PUT /api/v1/workflows/<id>` con `nodes` y `connections`, conservando `settings`.
  - También sirve `update_workflow` del MCP con el archivo completo.
- **Después de cualquier cambio, publicar** (`publish_workflow` del MCP). En n8n 2.x lo que se guarda es un borrador; lo que corre es la última versión publicada.

## Formato de los nodos Code

El `jsCode` va en una plantilla de texto, así que:
- cada barra invertida del código se escribe doble (`\\n`, `\\s`);
- no se usan comillas invertidas ni `${`.

## Ajustes y credenciales

**Ajustes de los dos workflows:**
- `timezone: America/Costa_Rica`
- `errorWorkflow: Sozkuqz4tak7yqqA`
- `executionTimeout: 2400` (40 min, para que las dos corridas del día no se crucen)

**Credenciales en n8n**, creadas por la API REST:
- `Gemini · Bralto` (googlePalmApi)
- `OpenAI · Bralto` (openAiApi)
- `Resend · Bralto` y `Bralto · Noticias API` (httpHeaderAuth, limitadas a sus dominios)
