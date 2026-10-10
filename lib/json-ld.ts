// JSON-LD dentro de <script>: un "</script>" en un título (o en un link de un feed) cerraría la
// etiqueta y correría lo que siga. Con < escapado, el JSON es el mismo y no hay cómo salir.
export const toJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')
