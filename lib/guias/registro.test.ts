import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ingresar, registrar, validarRegistro, type Datos, type Deps } from './registro.ts'

const base = { nombre: 'Ana Pérez', correo: 'Ana@Correo.com', whatsapp: '+506 8888-8888', acepta: 'on', guia: 'jarvis', origen: 'ig' }

test('el WhatsApp se acepta escrito de varias formas y se guarda limpio', () => {
  const casos: [string, string][] = [
    ['+506 8888-8888', '+50688888888'],
    ['(506) 8888 8888', '50688888888'],
    ['00506 88888888', '+50688888888'],
    ['8888.8888', '88888888'],
  ]
  for (const [entra, sale] of casos) {
    const r = validarRegistro({ ...base, whatsapp: entra })
    assert.equal(r.ok && r.datos.whatsapp, sale, entra)
  }
})

test('un WhatsApp muy corto o muy largo pide el código de país', () => {
  for (const malo of ['1234', '+1234567890123456', 'abc']) {
    const r = validarRegistro({ ...base, whatsapp: malo })
    assert.equal(r.ok, false)
    assert.match(!r.ok ? r.errores.whatsapp ?? '' : '', /código de país/)
  }
})

test('sin la casilla de privacidad no se abre', () => {
  const r = validarRegistro({ ...base, acepta: undefined })
  assert.equal(r.ok, false)
  assert.ok(!r.ok && r.errores.acepta)
})

test('el correo se guarda en minúsculas y un correo inválido da error', () => {
  const r = validarRegistro(base)
  assert.equal(r.ok && r.datos.correo, 'ana@correo.com')
  const malo = validarRegistro({ ...base, correo: 'ana@' })
  assert.ok(!malo.ok && malo.errores.correo)
})

test('el campo trampa lleno marca un bot y un origen raro pasa a web', () => {
  const r = validarRegistro({ ...base, sitio: 'http://spam', origen: 'tiktok' })
  assert.equal(r.ok && r.bot, true)
  assert.equal(r.ok && r.datos.origen, 'web')
})

function deps(over: Partial<Deps> = {}): Deps & { guardados: Datos[]; avisos: string[] } {
  const guardados: Datos[] = []
  const avisos: string[] = []
  return {
    guardados,
    avisos,
    limite: async () => true,
    buscar: async (correo) => (correo === 'ana@correo.com' ? 'id-ana' : null),
    guardar: async (d) => {
      guardados.push(d)
      return { id: 'id-nuevo', nuevo: true }
    },
    avisar: async (texto) => {
      avisos.push(texto)
    },
    ...over,
  }
}

const datos = (() => {
  const r = validarRegistro(base)
  if (!r.ok) throw new Error('base inválida')
  return r.datos
})()

test('registrar guarda, avisa con los datos y devuelve el contacto', async () => {
  const d = deps()
  assert.deepEqual(await registrar(datos, 'ip', d), { ok: true, contactoId: 'id-nuevo' })
  assert.equal(d.guardados.length, 1)
  assert.match(d.avisos[0], /Ana Pérez/)
  assert.match(d.avisos[0], /wa\.me\/50688888888/)
  assert.match(d.avisos[0], /Instagram/)
})

test('registrar con el límite agotado no guarda', async () => {
  const d = deps({ limite: async () => false })
  assert.deepEqual(await registrar(datos, 'ip', d), { ok: false, error: 'demasiados' })
  assert.equal(d.guardados.length, 0)
})

test('registrar sigue bien si el aviso falla', async () => {
  const lanza = deps({ avisar: () => { throw new Error('telegram caído') } })
  assert.equal((await registrar(datos, 'ip', lanza)).ok, true)
  const rechaza = deps({ avisar: async () => { throw new Error('telegram caído') } })
  assert.equal((await registrar(datos, 'ip', rechaza)).ok, true)
})

test('registrar devuelve fallo si no se pudo guardar', async () => {
  const d = deps({ guardar: async () => { throw new Error('supabase caído') } })
  assert.deepEqual(await registrar(datos, 'ip', d), { ok: false, error: 'fallo' })
})

test('un registro repetido (mismo correo y guía) no vuelve a avisar', async () => {
  const d = deps({ guardar: async () => ({ id: 'id-viejo', nuevo: false }) })
  assert.deepEqual(await registrar(datos, 'ip', d), { ok: true, contactoId: 'id-viejo' })
  assert.equal(d.avisos.length, 0)
})

test('ingresar con el correo abre si ya se registró, y respeta el límite', async () => {
  assert.equal(await ingresar('  ANA@correo.com ', 'ip', deps()), 'id-ana')
  assert.equal(await ingresar('otra@correo.com', 'ip', deps()), null)
  assert.equal(await ingresar('ana@', 'ip', deps()), null)
  assert.equal(await ingresar('ana@correo.com', 'ip', deps({ limite: async () => false })), null)
})
