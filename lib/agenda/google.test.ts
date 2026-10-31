import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clienteGoogle, cuentaDeLaAgenda, cuentasDelEntorno, enlaceMeet, ErrorGoogle, type CuentaGoogle } from './google.ts'

// Cuentas y datos inventados
const empresa: CuentaGoogle = { correo: 'prueba@bralto.io', refresh: 'r-empresa' }
const personal: CuentaGoogle = { correo: 'persona.prueba@ejemplo.com', refresh: 'r-personal' }

type Pedido = { url: URL; metodo: string; cuerpo: unknown }
type Respuesta = { status: number; json?: unknown }

// Un fetch falso que anota cada pedido y contesta lo que diga la función
function googleFalso(contestar: (p: Pedido) => Respuesta | undefined) {
  const pedidos: Pedido[] = []
  const f = (async (entrada: string | URL | Request, init?: RequestInit) => {
    const crudo = typeof init?.body === 'string' ? init.body : undefined
    let cuerpo: unknown = crudo
    if (crudo?.startsWith('{')) cuerpo = JSON.parse(crudo)
    else if (crudo) cuerpo = Object.fromEntries(new URLSearchParams(crudo))
    const p: Pedido = { url: new URL(String(entrada)), metodo: init?.method ?? 'GET', cuerpo }
    pedidos.push(p)
    if (p.url.host === 'oauth2.googleapis.com') {
      const refresh = (cuerpo as Record<string, string>).refresh_token
      return Response.json({ access_token: `acceso-${refresh}`, expires_in: 3600 })
    }
    const r = contestar(p) ?? { status: 404, json: { error: { message: 'Not Found' } } }
    return new Response(r.json === undefined ? null : JSON.stringify(r.json), { status: r.status })
  }) as typeof fetch
  const api = () => pedidos.filter((p) => p.url.host !== 'oauth2.googleapis.com')
  const tokens = () => pedidos.filter((p) => p.url.host === 'oauth2.googleapis.com')
  return { f, pedidos, api, tokens }
}

const cliente = (f: typeof fetch, reloj = { ms: Date.UTC(2026, 10, 2, 15) }) =>
  clienteGoogle({ clientId: 'id', clientSecret: 'secreto', fetch: f, ahora: () => reloj.ms, esperar: async () => {} })

// ── Cuentas ──────────────────────────────────────────────────────────────────────

test('las cuentas salen del entorno en orden, en minúsculas y solo con su permiso', () => {
  const env = {
    GOOGLE_CUENTA: 'Persona.Prueba@ejemplo.com',
    GOOGLE_REFRESH_TOKEN: 'r1',
    GOOGLE_CUENTA_2: 'prueba@bralto.io',
    GOOGLE_REFRESH_TOKEN_2: 'r2',
    GOOGLE_CUENTA_3: 'sin.permiso@ejemplo.com',
  }
  assert.deepEqual(cuentasDelEntorno(env), [
    { correo: 'persona.prueba@ejemplo.com', refresh: 'r1' },
    { correo: 'prueba@bralto.io', refresh: 'r2' },
  ])
})

test('la agenda va en la cuenta de la empresa, salvo que AGENDA_CUENTA diga otra', () => {
  const cuentas = [personal, empresa]
  assert.equal(cuentaDeLaAgenda(cuentas, {})?.correo, 'prueba@bralto.io')
  assert.equal(cuentaDeLaAgenda(cuentas, { AGENDA_CUENTA: 'Persona.Prueba@ejemplo.com' })?.correo, 'persona.prueba@ejemplo.com')
  assert.equal(cuentaDeLaAgenda(cuentas, { AGENDA_CUENTA: 'otra@ejemplo.com' }), null, 'una que no está conectada')
  assert.equal(cuentaDeLaAgenda([personal], {}), null, 'sin cuenta de la empresa')
})

// ── Acceso ───────────────────────────────────────────────────────────────────────

test('el acceso de cada cuenta se pide una vez y se reusa hasta que vence', async () => {
  const g = googleFalso(() => ({ status: 200, json: { calendars: { primary: { busy: [] } } } }))
  const reloj = { ms: Date.UTC(2026, 10, 2, 15) }
  const c = cliente(g.f, reloj)
  await c.ocupado(empresa, 0, 1)
  await c.ocupado(empresa, 0, 1)
  await c.ocupado(personal, 0, 1)
  assert.equal(g.tokens().length, 2)
  assert.equal(g.tokens()[0].cuerpo && (g.tokens()[0].cuerpo as Record<string, string>).grant_type, 'refresh_token')
  reloj.ms += 3600_000
  await c.ocupado(empresa, 0, 1)
  assert.equal(g.tokens().length, 3, 'vencido: se pide otro')
  assert.equal(g.api()[0].url.pathname, '/calendar/v3/freeBusy')
})

test('si Google no da acceso (permiso revocado), el error lo dice', async () => {
  const f = (async () => Response.json({ error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }, { status: 400 })) as typeof fetch
  await assert.rejects(cliente(f).ocupado(empresa, 0, 1), (err: unknown) => {
    assert.ok(err instanceof ErrorGoogle)
    assert.match(err.message, /invalid_grant/)
    return true
  })
})

test('un acceso rechazado (401) se olvida y el siguiente pedido trae uno nuevo', async () => {
  let primera = true
  const g = googleFalso(() => {
    if (primera) {
      primera = false
      return { status: 401, json: { error: { message: 'Invalid Credentials' } } }
    }
    return { status: 200, json: { calendars: { primary: { busy: [] } } } }
  })
  const c = cliente(g.f)
  await assert.rejects(c.ocupado(empresa, 0, 1), /Invalid Credentials/)
  await c.ocupado(empresa, 0, 1)
  assert.equal(g.tokens().length, 2)
})

// ── Ocupado ──────────────────────────────────────────────────────────────────────

test('freeBusy: pregunta por el calendario principal y devuelve lo ocupado en ms', async () => {
  const g = googleFalso(() => ({
    status: 200,
    json: { calendars: { primary: { busy: [{ start: '2026-11-06T14:30:00Z', end: '2026-11-06T15:30:00Z' }] } } },
  }))
  const desde = Date.UTC(2026, 10, 2, 14)
  const hasta = Date.UTC(2026, 10, 7)
  const ocupado = await cliente(g.f).ocupado(empresa, desde, hasta)
  assert.deepEqual(ocupado, [{ inicio: Date.UTC(2026, 10, 6, 14, 30), fin: Date.UTC(2026, 10, 6, 15, 30) }])
  const p = g.api()[0]
  assert.equal(p.metodo, 'POST')
  assert.deepEqual(p.cuerpo, { timeMin: '2026-11-02T14:00:00.000Z', timeMax: '2026-11-07T00:00:00.000Z', items: [{ id: 'primary' }] })
})

test('freeBusy con errores del calendario: lanza en vez de decir que está libre', async () => {
  const g = googleFalso(() => ({ status: 200, json: { calendars: { primary: { errors: [{ reason: 'notFound' }], busy: [] } } } }))
  await assert.rejects(cliente(g.f).ocupado(empresa, 0, 1), /notFound/)
})

// ── Eventos ──────────────────────────────────────────────────────────────────────

test('eventos: expandidos, en orden y de todas las páginas', async () => {
  const g = googleFalso((p) => ({
    status: 200,
    json: p.url.searchParams.get('pageToken')
      ? { items: [{ id: 'b' }] }
      : { items: [{ id: 'a' }], nextPageToken: 'siguiente' },
  }))
  const eventos = await cliente(g.f).eventos(personal, Date.UTC(2026, 10, 2, 6), Date.UTC(2026, 10, 4, 6))
  assert.deepEqual(eventos.map((e) => e.id), ['a', 'b'])
  const q = g.api()[0].url.searchParams
  assert.equal(q.get('singleEvents'), 'true')
  assert.equal(q.get('orderBy'), 'startTime')
  assert.equal(q.get('timeMin'), '2026-11-02T06:00:00.000Z')
})

// ── Crear, mover y cancelar ──────────────────────────────────────────────────────

const nuevo = {
  id: 'brdprueba01',
  summary: 'Prueba',
  start: { dateTime: '2026-11-06T09:00:00-06:00', timeZone: 'America/Costa_Rica' },
  end: { dateTime: '2026-11-06T09:30:00-06:00', timeZone: 'America/Costa_Rica' },
  conferenceData: { createRequest: { requestId: 'r-1', conferenceSolutionKey: { type: 'hangoutsMeet' as const } } },
}

test('crear: con Meet, sin correos de Google, y devuelve el enlace', async () => {
  const g = googleFalso((p) => (p.metodo === 'POST' ? { status: 200, json: { id: 'brdprueba01', hangoutLink: 'https://meet.google.com/aaa-bbbb-ccc' } } : undefined))
  const evento = await cliente(g.f).crear(empresa, nuevo)
  assert.equal(enlaceMeet(evento), 'https://meet.google.com/aaa-bbbb-ccc')
  const p = g.api()[0]
  assert.equal(p.url.pathname, '/calendar/v3/calendars/primary/events')
  assert.equal(p.url.searchParams.get('sendUpdates'), 'none')
  assert.equal(p.url.searchParams.get('conferenceDataVersion'), '1')
  assert.deepEqual(p.cuerpo, nuevo)
})

test('crear: si el Meet quedó pendiente, vuelve a preguntar hasta tener el enlace', async () => {
  let lecturas = 0
  const g = googleFalso((p) => {
    if (p.metodo === 'POST') return { status: 200, json: { id: 'brdprueba01', conferenceData: { createRequest: { status: { statusCode: 'pending' } } } } }
    lecturas++
    return lecturas < 2
      ? { status: 200, json: { id: 'brdprueba01', conferenceData: { createRequest: { status: { statusCode: 'pending' } } } } }
      : { status: 200, json: { id: 'brdprueba01', conferenceData: { entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/ddd-eeee-fff' }] } } }
  })
  const evento = await cliente(g.f).crear(empresa, nuevo)
  assert.equal(enlaceMeet(evento), 'https://meet.google.com/ddd-eeee-fff')
  assert.equal(lecturas, 2)
})

test('crear: si ese id ya existe (un reintento), devuelve el que ya estaba', async () => {
  const g = googleFalso((p) =>
    p.metodo === 'POST'
      ? { status: 409, json: { error: { message: 'The requested identifier already exists.' } } }
      : { status: 200, json: { id: 'brdprueba01', hangoutLink: 'https://meet.google.com/aaa-bbbb-ccc' } },
  )
  const evento = await cliente(g.f).crear(empresa, nuevo)
  assert.equal(evento.hangoutLink, 'https://meet.google.com/aaa-bbbb-ccc')
  assert.equal(g.api()[1].url.pathname, '/calendar/v3/calendars/primary/events/brdprueba01')
})

test('crear: un error de Google sin id propio se lanza', async () => {
  const g = googleFalso(() => ({ status: 500, json: { error: { message: 'Backend Error' } } }))
  await assert.rejects(cliente(g.f).crear(empresa, { ...nuevo, id: undefined }), /Backend Error/)
})

test('mover: cambia solo la hora, sin correos de Google', async () => {
  const g = googleFalso(() => ({ status: 200, json: { id: 'brdprueba01' } }))
  const inicio = { dateTime: '2026-11-06T15:00:00-06:00', timeZone: 'America/Costa_Rica' }
  const fin = { dateTime: '2026-11-06T15:30:00-06:00', timeZone: 'America/Costa_Rica' }
  await cliente(g.f).mover(empresa, 'brdprueba01', inicio, fin)
  const p = g.api()[0]
  assert.equal(p.metodo, 'PATCH')
  assert.equal(p.url.searchParams.get('sendUpdates'), 'none')
  assert.deepEqual(p.cuerpo, { start: inicio, end: fin })
})

test('cancelar: borra sin correos; si ya no estaba, no pasa nada; otro error se lanza', async () => {
  const ok = googleFalso(() => ({ status: 204 }))
  await cliente(ok.f).cancelar(empresa, 'brdprueba01')
  assert.equal(ok.api()[0].metodo, 'DELETE')
  assert.equal(ok.api()[0].url.searchParams.get('sendUpdates'), 'none')

  const ida = googleFalso(() => ({ status: 410, json: { error: { message: 'Resource has been deleted' } } }))
  await cliente(ida.f).cancelar(empresa, 'brdprueba01')

  const mal = googleFalso(() => ({ status: 500, json: { error: { message: 'Backend Error' } } }))
  await assert.rejects(cliente(mal.f).cancelar(empresa, 'brdprueba01'), /Backend Error/)
})

test('enlace de Meet: el de la llamada o el punto de entrada de video', () => {
  assert.equal(enlaceMeet({ hangoutLink: 'https://meet.google.com/x' }), 'https://meet.google.com/x')
  assert.equal(enlaceMeet({ conferenceData: { entryPoints: [{ entryPointType: 'phone', uri: 'tel:+1' }, { entryPointType: 'video', uri: 'https://meet.google.com/y' }] } }), 'https://meet.google.com/y')
  assert.equal(enlaceMeet({}), null)
})
