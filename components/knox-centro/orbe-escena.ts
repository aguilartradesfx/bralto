import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Mesh,
  NoBlending,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
  type IUniform,
  type ShaderMaterialParameters,
} from 'three'
import type { EstadoOrbe } from '@/lib/knox/centro/orbe'
import { AURA, ESFERA, ESPECTRO, IMAGEN, LUZ, MALLA, PANTALLA, PHOSPHOR, PLANO, PUNTO, PUNTO_COLOR, RAYOS } from './orbe-sombreadores'

// El orbe en 3D (three.js): el que eligió Ale el 1/11, con la misma cámara y los mismos números. Se dibuja en tres
// pasos: Phosphor 30 más chico (es lo más pesado), el orbe sobre negro como en la página donde lo eligió, y al final
// en el lienzo con lo negro transparente (sombreador LUZ), para que su luz se sume a los anillos y al fondo del panel.

// Lo eligió en un cuadro de 520 px: el tamaño de los puntos se mide contra ese cuadro, así se ve igual de grande
const LADO_APROBADO = 520
// Phosphor 30 hace 80 pasos por pixel: se dibuja a lo más de este lado y se estira (es humo, no se nota). Medido en la
// Mac de Ale (2056×1290, Retina): a 640 el panel bajaba a ~52 cuadros por segundo; a 480 va parejo a 60
const LADO_PHOSPHOR = 480

type Uniformes = Record<string, IUniform>

const color = (hex: number) => new Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255)

function direccion(): [number, number, number] {
  const u = Math.random() * 2 - 1
  const th = Math.random() * Math.PI * 2
  const s = Math.sqrt(1 - u * u)
  return [s * Math.cos(th), u, s * Math.sin(th)]
}

// Direcciones al azar sobre la esfera, con dos números por partícula. Con «rayos», las partículas se reparten en esa
// cantidad de direcciones (casi iguales): forman rayos punteados en vez de una nube pareja
function nube(N: number, extra: () => number, rayos = 0) {
  const dirs = rayos ? Array.from({ length: rayos }, direccion) : null
  const pos = new Float32Array(N * 3)
  const azar = new Float32Array(N)
  const otro = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const [x, y, z] = dirs ? dirs[i % rayos].map((v) => v + (Math.random() - 0.5) * 0.008) : direccion()
    pos[i * 3] = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
    azar[i] = Math.random()
    otro[i] = extra()
  }
  return { pos, azar, otro }
}

const pantalla = (uniforms: Uniformes, fragmentos: string, extra: ShaderMaterialParameters = {}) => {
  const m = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ uniforms, vertexShader: PANTALLA, fragmentShader: fragmentos, depthTest: false, depthWrite: false, ...extra }))
  m.frustumCulled = false
  return m
}

export type EscenaOrbe = {
  // Vuelve a medir el lienzo (al cambiar la ventana)
  medir: () => void
  dibujar: (e: EstadoOrbe) => void
  liberar: () => void
}

// Falla (lanza) si el navegador no puede dibujar en 3D
export function crearEscena(canvas: HTMLCanvasElement): EscenaOrbe {
  const renderer = new WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' })
  renderer.setPixelRatio(1)
  renderer.setClearColor(0x000000, 0)
  const camara = new PerspectiveCamera(42, 1, 0.1, 50)
  camara.position.set(0, 0, 5.2)
  const naranja = color(0xff6d28)
  const luz = color(0xffe2c8)
  const geometrias: BufferGeometry[] = []
  const materiales: ShaderMaterial[] = []

  const rtPhosphor = new WebGLRenderTarget(1, 1, { depthBuffer: false })
  const rtOrbe = new WebGLRenderTarget(1, 1)

  // Phosphor 30 (capas 10, 11 y 13), solo en su escena
  const uPhosphor: Uniformes = {
    uTiempo: { value: 0 },
    uFuego: { value: 1 },
    uBlanco: { value: 1 },
    uRojo: { value: 1 },
    uCampo: { value: 0.45 },
    uResolucion: { value: new Vector2(1, 1) },
    uGiro: { value: 0 },
    uEje: { value: new Vector3(0, 1, 0) },
    uTiempoEje: { value: 0 },
  }
  const escenaPhosphor = new Scene()
  escenaPhosphor.add(pantalla(uPhosphor, PHOSPHOR))

  // El orbe, sobre negro: primero Phosphor 30 detrás de todo, después la esfera y las partículas
  const escena = new Scene()
  const fondo = pantalla({ uImagen: { value: rtPhosphor.texture } }, IMAGEN, { transparent: true, blending: AdditiveBlending })
  fondo.renderOrder = -1
  escena.add(fondo)

  // La esfera (capas 3 y 5). Escribe profundidad: así las partículas que pasan por detrás se esconden
  const uEsfera: Uniformes = { uNivel: { value: 0 }, uColor: { value: naranja }, uLuz: { value: luz } }
  const esfera = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({ uniforms: uEsfera, vertexShader: PLANO, fragmentShader: ESFERA, transparent: true, depthWrite: true, blending: AdditiveBlending }),
  )
  escena.add(esfera)

  const puntos = (geo: BufferGeometry, uniforms: Uniformes, vertices: string, fragmentos: string, extra: ShaderMaterialParameters = {}) => {
    const material = new ShaderMaterial({ uniforms, vertexShader: vertices, fragmentShader: fragmentos, transparent: true, depthWrite: false, blending: AdditiveBlending, ...extra })
    const p = new Points(geo, material)
    p.renderOrder = 1
    escena.add(p)
    return p
  }
  const nubeDe = (N: number, extra: () => number, nombre: string, rayos = 0) => {
    const { pos, azar, otro } = nube(N, extra, rayos)
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(pos, 3))
    geo.setAttribute('aAzar', new BufferAttribute(azar, 1))
    geo.setAttribute(nombre, new BufferAttribute(otro, 1))
    return geo
  }
  const deNube = (tam: number): Uniformes => ({
    uTiempo: { value: 0 },
    uNivel: { value: 0 },
    uGiro: { value: 0 },
    uPix: { value: 1 },
    uTam: { value: tam },
    uBandas: { value: new Array(12).fill(0) },
    uColor: { value: naranja },
    uLuz: { value: luz },
  })

  // Capa 1: 18.200 partículas, más densas cerca de la esfera
  const uAura = deNube(2.4)
  const aura = puntos(nubeDe(18200, () => Math.pow(Math.random(), 2.2), 'aRadio'), uAura, AURA, PUNTO)
  // Capa 6: 16.000 partículas en 1.400 rayos, más juntas cerca de la esfera
  const uEspectro = deNube(2.2)
  const espectro = puntos(nubeDe(16000, () => Math.pow(Math.random(), 1.5), 'aLargo', 1400), uEspectro, ESPECTRO, PUNTO)

  // Capa 4: 50.000 partículas dentro de la esfera que se pegan a los rayos; están adentro, no las tapa la esfera
  const uRayos: Uniformes = { uNivel: { value: 0 }, uFase: { value: 0 }, uPix: { value: 1 }, uTam: { value: 1.8 }, uColor: { value: naranja }, uLuz: { value: luz } }
  {
    const N = 50000
    const pos = new Float32Array(N * 3)
    const azar = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const [x, y, z] = direccion()
      const r = 0.98 * Math.cbrt(Math.random())
      pos[i * 3] = x * r
      pos[i * 3 + 1] = y * r
      pos[i * 3 + 2] = z * r
      azar[i] = Math.random()
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(pos, 3))
    geo.setAttribute('aAzar', new BufferAttribute(azar, 1))
    puntos(geo, uRayos, RAYOS, PUNTO_COLOR, { depthTest: false }).frustumCulled = false
  }

  // Capa 8: una red de 90 filas; cerca de los polos se salta columnas para que quede pareja
  const uMalla: Uniformes = {
    uNivel: { value: 0 },
    uOla: { value: 0 },
    uPix: { value: 1 },
    uTam: { value: 2.3 },
    uBandas: { value: new Array(12).fill(0) },
    uAbajo: { value: color(0xff4418) },
    uArriba: { value: color(0xffc98f) },
    uLuz: { value: luz },
  }
  const malla = (() => {
    const filas = 90
    const columnas = 180
    const lista: number[] = []
    for (let f = 0; f < filas; f++) {
      const th = (Math.PI * (f + 0.5)) / filas
      const salto = Math.max(1, Math.round(1 / Math.max(Math.sin(th), 0.08)))
      for (let c = 0; c < columnas; c += salto) {
        const lon = (2 * Math.PI * c) / columnas
        lista.push(Math.sin(th) * Math.cos(lon), Math.cos(th), Math.sin(th) * Math.sin(lon))
      }
    }
    const N = lista.length / 3
    const azar = new Float32Array(N)
    for (let i = 0; i < N; i++) azar[i] = Math.random()
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(lista), 3))
    geo.setAttribute('aAzar', new BufferAttribute(azar, 1))
    return puntos(geo, uMalla, MALLA, PUNTO_COLOR)
  })()

  // Al lienzo: lo negro, transparente
  const escenaLuz = new Scene()
  escenaLuz.add(pantalla({ uImagen: { value: rtOrbe.texture } }, LUZ, { blending: NoBlending }))

  escena.traverse((o) => {
    if (o instanceof Mesh || o instanceof Points) {
      geometrias.push(o.geometry)
      materiales.push(o.material as ShaderMaterial)
    }
  })
  for (const s of [escenaPhosphor, escenaLuz])
    s.traverse((o) => {
      if (o instanceof Mesh) {
        geometrias.push(o.geometry)
        materiales.push(o.material as ShaderMaterial)
      }
    })

  // El lado del lienzo en pixeles de la pantalla (con la escala del panel y hasta 1,5 por pixel, como en la página
  // donde lo eligió). Se mide al empezar y cuando cambia la ventana, no en cada cuadro
  let lado = 0
  let medirPendiente = true
  const ajustar = () => {
    medirPendiente = false
    const pix = Math.min(window.devicePixelRatio || 1, 1.5)
    const nuevo = Math.round(canvas.getBoundingClientRect().width * pix)
    if (!nuevo || nuevo === lado) return
    lado = nuevo
    renderer.setSize(lado, lado, false)
    rtOrbe.setSize(lado, lado)
    const fosforo = Math.min(lado, LADO_PHOSPHOR)
    rtPhosphor.setSize(fosforo, fosforo)
    ;(uPhosphor.uResolucion.value as Vector2).set(fosforo, fosforo)
    for (const u of [uAura, uEspectro, uRayos, uMalla]) u.uPix.value = lado / LADO_APROBADO
  }

  return {
    medir: () => {
      medirPendiente = true
    },
    dibujar: (e) => {
      if (medirPendiente) ajustar()
      if (!lado) return
      const t = e.reloj
      uAura.uTiempo.value = t
      uAura.uNivel.value = e.nivel
      uAura.uGiro.value = e.giroAura
      uEspectro.uTiempo.value = t
      uEspectro.uNivel.value = e.nivel
      uEspectro.uGiro.value = e.giroEspectro
      const bandasEspectro = uEspectro.uBandas.value as number[]
      const bandasMalla = uMalla.uBandas.value as number[]
      for (let k = 0; k < 12; k++) {
        bandasEspectro[k] = e.bandas[k]
        bandasMalla[k] = e.bandas[k]
      }
      // La esfera y los rayos siguen a la voz más despacio: se encienden sin parpadear con cada sílaba
      uEsfera.uNivel.value = e.nivelLento
      uRayos.uNivel.value = e.nivelLento
      uRayos.uFase.value = e.fase
      uMalla.uNivel.value = e.nivel
      uMalla.uOla.value = e.ola
      malla.rotation.y = 0.15 * e.ola
      aura.rotation.y = e.giro
      aura.rotation.x = 0.2 * Math.sin(t * 0.11)
      espectro.rotation.x = 0.15 * Math.sin(t * 0.09 + 1.3)
      // Phosphor 30 corre con su propio reloj: gira hacia la derecha (una vuelta cada ~2 min) y el eje rota como las
      // agujas del reloj (un ciclo cada ~9 min). Ale lo quiere casi imperceptible
      uPhosphor.uTiempo.value = t
      uPhosphor.uGiro.value = t * 0.05
      uPhosphor.uTiempoEje.value = t * 0.012
      const eje = Math.PI / 2 - t * 0.012
      ;(uPhosphor.uEje.value as Vector3).set(Math.cos(eje), Math.sin(eje), 0)

      renderer.setRenderTarget(rtPhosphor)
      renderer.render(escenaPhosphor, camara)
      renderer.setRenderTarget(rtOrbe)
      renderer.render(escena, camara)
      renderer.setRenderTarget(null)
      renderer.render(escenaLuz, camara)
    },
    liberar: () => {
      for (const g of geometrias) g.dispose()
      for (const m of materiales) m.dispose()
      rtPhosphor.dispose()
      rtOrbe.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
