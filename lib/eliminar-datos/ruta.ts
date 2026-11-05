// Aparte y sin dependencias: lo usa el middleware, que corre en el runtime Edge (sin node:crypto ni zod).
// Meta llama por POST a la dirección que se le dio (con o sin /es): esa llamada va a la API, no a la página.
// El formulario de la misma página también envía por POST a esa dirección (server action), pero con la
// cabecera Next-Action: ese se deja pasar.
export function esAvisoDeMeta(metodo: string, ruta: string, nextAction: string | null): boolean {
  return metodo === 'POST' && !nextAction && /^\/(?:(?:es|en)\/)?eliminar-datos\/?$/.test(ruta)
}
