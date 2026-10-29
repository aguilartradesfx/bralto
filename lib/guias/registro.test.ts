import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ingresar, registrar, validarRegistro, type Datos, type Deps } from './registro.ts'

const base = { nombre: 'Ana Pérez', correo: 'Ana@Correo.com', whatsapp: '+506 8888-8888', acepta: 'on', guia: 'jarvis', origen: 'ig' }

test('el WhatsApp con código de país se acepta escrito de varias formas y se guarda siempre con +', () => {
  const casos: [string, string][] = [
    ['+506 8888-8888', '+50688888888'],
    ['00506 88888888', '+50688888888'],
    ['+1 (213) 261-0301', '+12132610301'],
    ['+52 1 55.1234.5678', '+5215512345678'],
  ]
  for (const [entra, sale] of casos) {
    const r = validarRegistro({ ...base, whatsapp: entra })
    assert.equal(r.ok && r.datos.whatsapp, sale, entra)
  }
})

test('un WhatsApp sin código de país, muy corto o muy largo pide el código de país', () => {
  for (const malo of ['8888 8888', '(506) 8888 8888', '07911 123456', '1234', '+1234567890123456', 'abc']) {
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

test('el correo se guarda en minúsculas y un correo inválido o gigante da error', () => {
  const r = validarRegistro(base)
  assert.equal(r.ok && r.datos.correo, 'ana@correo.com')
  const malo = validarRegistro({ ...base, correo: 'ana@' })
  assert.ok(!malo.ok && malo.errores.correo)
  const gigante = validarRegistro({ ...base, correo: `${'a'.repeat(250)}@correo.com` })
  assert.ok(!gigante.ok && gigante.errores.correo)
})

test('el nombre se guarda en una sola línea, sin espacios de más', () => {
  const r = validarRegistro({ ...base, nombre: '  Ana \n Pérez\tGómez  ' })
  assert.equal(r.ok && r.datos.nombre, 'Ana Pérez Gómez')
})

test('el campo trampa lleno marca un bot y un origen raro pasa a web', () => {
  const r = validarRegistro({ ...base, sitio: 'http://spam', origen: 'tiktok' })
  assert.equal(r.ok && r.bot, true)
  assert.equal(r.ok && r.datos.origen, 'web')
})

function deps(over: Partial<Deps> = {}): Deps & { guardados: Datos[]; avisos: string[]; limites: string[] } {
  const guardados: Datos[] = []
  const avisos: string[] = []
  const limites: string[] = []
  return {
    guardados,
    avisos,
    limites,
    limite: async (clave, max) => {
      limites.push(`${clave}/${max}`)
      return true
    },
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
  // Un tope alto: detrás de la misma IP del celular puede haber mucha gente real
  assert.deepEqual(d.limites, ['registro:ip/60'])
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

test('ingresar con el correo abre si ya se registró y dice por qué no cuando no', async () => {
  const d = deps()
  assert.deepEqual(await ingresar('  ANA@correo.com ', 'ip', d), { ok: true, contactoId: 'id-ana' })
  assert.deepEqual(d.limites, ['correo:ip/20'])
  assert.deepEqual(await ingresar('otra@correo.com', 'ip', deps()), { ok: false, error: 'no-existe' })
  assert.deepEqual(await ingresar('ana@', 'ip', deps()), { ok: false, error: 'invalido' })
  assert.deepEqual(await ingresar('ana@correo.com', 'ip', deps({ limite: async () => false })), { ok: false, error: 'demasiados' })
})

test('ingresar devuelve fallo si la base no responde', async () => {
  const d = deps({ buscar: async () => { throw new Error('supabase caído') } })
  assert.deepEqual(await ingresar('ana@correo.com', 'ip', d), { ok: false, error: 'fallo' })
})
