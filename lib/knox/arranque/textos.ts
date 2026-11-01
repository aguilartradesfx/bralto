// Lo que Knox dice igual cada vez que arranca: el paso al reporte (son palabras de Ale) y el aviso si el reporte
// tarda. Lo usan el servidor, que lo narra una vez, y la pantalla, para el subtítulo.
export const TRANSICION = 'Ahora sí, acá el reporte.'
export const YA_CASI = 'Ya casi lo tengo, dame un segundito.'
export const FIJOS = { transicion: TRANSICION, 'ya-casi': YA_CASI } as const
export type Fijo = keyof typeof FIJOS

export const esFijo = (id: string): id is Fijo => Object.hasOwn(FIJOS, id)

// Lo que la pantalla necesita de un arranque (el audio sale de /api/knox/arranque/<id>): lo que dice, en dos partes
// (el saludo y lo que trae en la cabeza), y en qué segundo empieza cada una
export type Arranque = { id: string; secciones: string[]; inicios: number[] }
