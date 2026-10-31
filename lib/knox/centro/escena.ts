// El lienzo del Centro de mando. El diseño se hizo en 1920×1080, pero la pantalla de Ale es 16:10 y la app va a
// pantalla completa: el lienzo toma la forma de la ventana, sin bordes negros. Si la ventana es más alta que 16:9, son
// 1920 de ancho y el alto que haga falta; si es más ancha, 1080 de alto y el ancho que haga falta. Así la letra y los
// márgenes quedan como en el diseño y las columnas se reparten lo que sobra. Puro, con pruebas.

export const BASE_ANCHO = 1920
export const BASE_ALTO = 1080

export type Medidas = { ancho: number; alto: number; escala: number }

export function medidas(ventanaAncho: number, ventanaAlto: number): Medidas {
  if (!(ventanaAncho > 0 && ventanaAlto > 0)) return { ancho: BASE_ANCHO, alto: BASE_ALTO, escala: 1 }
  const r = ventanaAncho / ventanaAlto
  if (r <= BASE_ANCHO / BASE_ALTO) return { ancho: BASE_ANCHO, alto: Math.max(BASE_ALTO, Math.round(BASE_ANCHO / r)), escala: ventanaAncho / BASE_ANCHO }
  return { ancho: Math.max(BASE_ANCHO, Math.round(BASE_ALTO * r)), alto: BASE_ALTO, escala: ventanaAlto / BASE_ALTO }
}

// El mismo cálculo, para el script que corre antes del primer pintado (deja las medidas en variables de CSS)
export const SCRIPT_MEDIDAS =
  '(function(){var d=document.documentElement;function f(){var w=innerWidth,h=innerHeight,a=1920,b=1080,e=1,r;' +
  'if(w>0&&h>0){r=w/h;if(r<=1920/1080){b=Math.max(1080,Math.round(1920/r));e=w/1920}else{a=Math.max(1920,Math.round(1080*r));e=h/1080}}' +
  "d.style.setProperty('--kc-escala',String(e));d.style.setProperty('--kc-ancho',a+'px');d.style.setProperty('--kc-alto',b+'px');" +
  "d.style.setProperty('--kc-extra',(b-1080)+'px')}f();addEventListener('resize',f)})()"

// Las columnas de Hoy: los paneles del diseño (de arriba abajo) crecen en proporción a su alto original
export const ARRIBA = 108 // donde empiezan las columnas
export const ABAJO = 214 // lo que ocupan abajo el pulso y su margen
export const ESPACIO = 18
export const DISENO_IZQUIERDA = [280, 268, 174]
export const DISENO_DERECHA = [290, 208, 224]

export type Tramo = { top: number; alto: number }

export function repartir(altoLienzo: number, diseno: number[]): Tramo[] {
  const libre = altoLienzo - ARRIBA - ABAJO - ESPACIO * (diseno.length - 1)
  const total = diseno.reduce((a, b) => a + b, 0)
  let y = ARRIBA
  return diseno.map((d) => {
    const tramo = { top: y, alto: (libre * d) / total }
    y += tramo.alto + ESPACIO
    return tramo
  })
}

// El centro de los anillos: el bloque de Knox (758 de alto) queda en el medio del espacio entre las columnas
export const centroKnox = (m: Pick<Medidas, 'ancho' | 'alto'>) => ({ x: m.ancho / 2, y: ARRIBA + (m.alto - BASE_ALTO) / 2 + 290 })

const entre = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

// Cuántas conversaciones caben en «Te están esperando» y cuántas cosas en «Tu día», según el alto del panel
export const caben = {
  // 93: el borde, el título y el pie (su margen se achica si hace falta); 54: cada conversación
  esperando: (altoPanel: number) => entre(Math.floor((altoPanel - 93) / 54), 3, 8),
  dia: (altoPanel: number) => entre(Math.floor((altoPanel - 56) / 42), 4, 9),
}
