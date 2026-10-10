# Workflows de n8n de Bralto

Código del SDK de n8n (`@n8n/workflow-sdk`) de los workflows que se crean por MCP. Es la fuente
de verdad: para cambiar un workflow, se edita aquí y se aplica con `update_workflow` (el MCP
reescribe el workflow entero desde este código).

| Archivo | Workflow | Id |
|---|---|---|
| `noticias-ia-diarias.js` | Bralto · Noticias IA diarias | `K0B1lsgU6cxPgtE5` |
| `noticias-ia-errores.js` | Bralto · Noticias IA · errores | `Sozkuqz4tak7yqqA` |

Ojo al editar los nodos Code: el `jsCode` va en una plantilla de texto, así que cada barra
invertida del código se escribe doble (`\\n`, `\\s`) y no se usan comillas invertidas ni `${`.

Ajustes que el SDK no guarda y se ponen por la API REST (`PUT /api/v1/workflows/<id>`):
`timezone: America/Costa_Rica` y `errorWorkflow: Sozkuqz4tak7yqqA` en el workflow diario.

Para aplicar cambios:

- Solo el código de nodos Code: `node n8n/sync-code.mjs n8n/noticias-ia-diarias.js K0B1lsgU6cxPgtE5`
  (sube el `jsCode` de cada nodo Code y deja todo lo demás como está).
- Nodos, conexiones u opciones: `update_workflow` del MCP con el archivo completo, y después
  volver a poner `timezone` y `errorWorkflow` por la API REST si se perdieron.

Credenciales en n8n (creadas por la API REST): `Gemini · Bralto` (googlePalmApi),
`Resend · Bralto` y `Bralto · Noticias API` (httpHeaderAuth, limitadas a sus dominios).
