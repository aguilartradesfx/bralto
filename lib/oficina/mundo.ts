// El plano de la Oficina de Knox: 24 oficinas con puerta de verdad, pasillos, la oficina de Ale
// y por dónde se camina (A*). Todo es geometría pura: nada de canvas ni de DOM.

export type Punto = [number, number]

export type Sala = {
  puesto: number
  fila: number
  col: number
  rx: number
  ry: number
  abajo: boolean
  asiento: Punto
  visita: Punto
}

export type Medidas = {
  M: number
  HL: number
  RW: number
  RH: number
  CH: number
  AW: number
  X0: number
  AX: number
  FILAS: number[]
  PAS: number[]
}

export type Mundo = {
  W: 906
  H: 476
  salas: Sala[]
  libre(x: number, y: number): boolean
  ruta(a: Punto, b: Punto): Punto[]
  asiento(id: string): Punto
  visita(id: string): Punto
  PARA_TI: Punto
  medidas: Medidas
}

const M = 6, HL = 24, RW = 120, RH = 96, CH = 40, AW = 150, X0 = M + HL, AX = X0 + 6 * RW
const FILAS = [M, M + RH + CH, M + 2 * RH + CH, M + 3 * RH + 2 * CH]
const PAS = [M + RH, M + 3 * RH + CH]
const W = AX + AW + M, H = M + 4 * RH + 2 * CH + M
const CEL = 4, GW = Math.ceil(W / CEL), GH = Math.ceil(H / CEL)
const PARA_TI: Punto = [AX + 50, M + 242]

export const MEDIDAS: Medidas = { M, HL, RW, RH, CH, AW, X0, AX, FILAS, PAS }

export function crearMundo(agentes: { id: string; puesto: number }[]): Mundo {
  const libre = new Uint8Array(GW * GH)
  function marcar(x: number, y: number, w: number, h: number, v: number) {
    for (let j = Math.max(0, Math.floor(y / CEL)); j < Math.min(GH, Math.ceil((y + h) / CEL)); j++)
      for (let i = Math.max(0, Math.floor(x / CEL)); i < Math.min(GW, Math.ceil((x + w) / CEL)); i++) libre[j * GW + i] = v
  }
  // las 24 oficinas existen siempre; el puesto del agente decide en cuál vive
  const salas: Sala[] = []
  for (let p = 0; p < 24; p++) {
    const f = Math.floor(p / 6), col = p % 6, rx = X0 + col * RW, ry = FILAS[f]
    salas.push({ puesto: p, fila: f, col, rx, ry, abajo: f % 2 === 0, asiento: [rx + 66, ry + 68], visita: [rx + 50, ry + 88] })
  }
  const salaDe: Record<string, Sala> = {}
  agentes.forEach((k) => {
    const s = salas[k.puesto]
    if (s) salaDe[k.id] = s
  })

  // por dónde se puede caminar: el carril va por el centro del pasillo
  PAS.forEach((py) => marcar(M + 4, py + 22, AX - M - 2, 14, 1))
  marcar(M + 4, PAS[0] + 22, HL - 6, PAS[1] - PAS[0] + 14, 1)
  salas.forEach((s) => {
    const x = s.rx, y = s.ry
    marcar(x + 6, y + 48, RW - 12, RH - 54, 1)
    if (s.abajo) marcar(x + 10, y + RH - 10, 18, 36, 1)
    else marcar(x + 10, y - 14, 18, 64, 1)
    marcar(x + 32, y + 57, 68, 24, 0); marcar(x + 98, y + 44, 22, 34, 0); marcar(x + 98, y + 80, 22, 16, 0)
    marcar(x + 58, y + 50, 16, 22, 1)
  })
  marcar(AX + 6, M + 48, AW - 12, H - 2 * M - 54, 1)
  PAS.forEach((py) => marcar(AX - 10, py + 22, 20, 14, 1))
  marcar(AX + 34, M + 46, 84, 40, 0); marcar(AX + 16, M + 212, 70, 20, 0); marcar(AX + 16, M + 372, 60, 30, 0)
  marcar(AX + 122, M + 44, 22, 34, 0); marcar(AX + 6, M + 420, 22, 40, 0); marcar(AX + 122, M + 420, 22, 40, 0)

  function esLibre(x: number, y: number): boolean {
    const i = Math.floor(x / CEL), j = Math.floor(y / CEL)
    if (!(x >= 0 && y >= 0) || i >= GW || j >= GH) return false
    return libre[j * GW + i] === 1
  }

  // A*: 4 direcciones, castiga los giros para que camine derechito
  function celda(p: Punto): Punto {
    return [Math.min(GW - 1, Math.max(0, Math.floor(p[0] / CEL))), Math.min(GH - 1, Math.max(0, Math.floor(p[1] / CEL)))]
  }
  function cerca(c: Punto): Punto {
    if (libre[c[1] * GW + c[0]]) return c
    for (let r = 1; r < 14; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const x = c[0] + dx, y = c[1] + dy
          if (x >= 0 && y >= 0 && x < GW && y < GH && libre[y * GW + x]) return [x, y]
        }
    return c
  }
  function centro(i: number): Punto {
    return [(i % GW) * CEL + CEL / 2, ((i / GW) | 0) * CEL + CEL / 2]
  }
  function ruta(a: Punto, b: Punto): Punto[] {
    const s = cerca(celda(a)), t = cerca(celda(b)), N = GW * GH, si = s[1] * GW + s[0], ti = t[1] * GW + t[0]
    const g = new Float32Array(N).fill(1e9), de = new Int32Array(N).fill(-1), dir = new Int8Array(N).fill(-1), listo = new Uint8Array(N)
    const heap: [number, number][] = []
    const hh = (i: number) => Math.abs((i % GW) - t[0]) + Math.abs(((i / GW) | 0) - t[1])
    function meter(i: number, f: number) {
      heap.push([f, i])
      let n = heap.length - 1
      while (n > 0) {
        const p = (n - 1) >> 1
        if (heap[p][0] <= heap[n][0]) break
        const q = heap[p]; heap[p] = heap[n]; heap[n] = q; n = p
      }
    }
    function sacar(): [number, number] {
      const top = heap[0], ult = heap.pop() as [number, number]
      if (heap.length) {
        heap[0] = ult
        let n = 0
        for (;;) {
          const l = 2 * n + 1, r = l + 1
          let m = n
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r
          if (m === n) break
          const q = heap[m]; heap[m] = heap[n]; heap[n] = q; n = m
        }
      }
      return top
    }
    const D = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    g[si] = 0; meter(si, hh(si))
    while (heap.length) {
      const cur = sacar()[1]
      if (listo[cur]) continue
      listo[cur] = 1
      if (cur === ti) break
      const cx = cur % GW, cy = (cur / GW) | 0
      for (let d = 0; d < 4; d++) {
        const nx = cx + D[d][0], ny = cy + D[d][1]
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue
        const ni = ny * GW + nx
        if (!libre[ni] || listo[ni]) continue
        const costo = g[cur] + 1 + (dir[cur] >= 0 && dir[cur] !== d ? 0.6 : 0)
        if (costo < g[ni]) { g[ni] = costo; de[ni] = cur; dir[ni] = d; meter(ni, costo + hh(ni) * 1.001) }
      }
    }
    if (si !== ti && de[ti] < 0) return [[b[0], b[1]]]
    const cs: number[] = []
    for (let i = ti; i >= 0; i = de[i]) { cs.push(i); if (i === si) break }
    cs.reverse()
    const pts: Punto[] = [centro(cs[0])]
    for (let j = 1; j < cs.length - 1; j++) if (dir[cs[j]] !== dir[cs[j + 1]]) pts.push(centro(cs[j]))
    pts.push([b[0], b[1]])
    return pts
  }

  return {
    W: 906, H: 476, salas, libre: esLibre, ruta,
    asiento: (id) => { const s = salaDe[id]; return s ? [s.asiento[0], s.asiento[1]] : [PARA_TI[0], PARA_TI[1]] },
    visita: (id) => { const s = salaDe[id]; return s ? [s.visita[0], s.visita[1]] : [PARA_TI[0], PARA_TI[1]] },
    PARA_TI, medidas: MEDIDAS,
  }
}
