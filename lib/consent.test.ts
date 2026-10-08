import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { PRIVATE_SURFACE_JS } from './host-routing.ts'
import {
  CONSENT_STORAGE_KEY,
  readConsent,
  REGION_COOKIE,
  requiresOptIn,
  tagManagerBootScript,
  tagsAllowed,
  trackingCookieNames,
} from './consent.ts'

test('opt-in: países de la UE, el EEE y el Reino Unido', () => {
  for (const country of ['ES', 'DE', 'FR', 'IE', 'PT', 'NO', 'IS', 'GB', 'es']) {
    assert.equal(requiresOptIn(country), true, country)
  }
})

test('sin opt-in: Costa Rica, el resto de América y país desconocido', () => {
  for (const country of ['CR', 'MX', 'US', 'CO', 'BR', '', null, undefined]) {
    assert.equal(requiresOptIn(country), false, String(country))
  }
})

test('la elección guardada solo vale si es una de las dos opciones', () => {
  assert.equal(readConsent('all'), 'all')
  assert.equal(readConsent('essential'), 'essential')
  assert.equal(readConsent('yes'), null)
  assert.equal(readConsent(null), null)
})

test('etiquetas: "Aceptar todo" las carga, "Solo esenciales" nunca; sin elegir, depende de la región', () => {
  assert.equal(tagsAllowed('all', true), true)
  assert.equal(tagsAllowed('essential', false), false)
  assert.equal(tagsAllowed(null, true), false)
  assert.equal(tagsAllowed(null, false), true)
})

type BootEnv = { stored?: string | null; cookie?: string; host?: string; path?: string; storageThrows?: boolean }

// Ejecuta el script inline del <head> como lo hace el navegador y cuenta cuántas veces inserta GTM
function runBoot(env: BootEnv = {}) {
  const inserted: Array<{ src?: string }> = []
  const sandbox: Record<string, unknown> = {
    location: { hostname: env.host ?? 'www.bralto.io', pathname: env.path ?? '/es' },
    localStorage: {
      getItem(key: string) {
        if (env.storageThrows) throw new Error('SecurityError')
        return key === CONSENT_STORAGE_KEY ? (env.stored ?? null) : null
      },
    },
    document: {
      cookie: env.cookie ?? '',
      createElement: () => ({}),
      getElementsByTagName: () => [{ parentNode: { insertBefore: (el: { src?: string }) => inserted.push(el) } }],
    },
  }
  sandbox.window = sandbox
  vm.runInNewContext(tagManagerBootScript({ gtmId: 'GTM-TEST', privateSurfaceJs: PRIVATE_SURFACE_JS }), sandbox)
  const load = sandbox.__braltoLoadTags as (() => void) | undefined
  return { inserted, load, sandbox }
}

const EU = `${REGION_COOKIE}=eu`

test('sin elegir y fuera de la UE: GTM carga como siempre', () => {
  const { inserted } = runBoot()
  assert.equal(inserted.length, 1)
  assert.match(inserted[0].src ?? '', /googletagmanager\.com\/gtm\.js\?id=GTM-TEST/)
})

test('sin elegir en la UE o el Reino Unido: no carga nada hasta que acepte', () => {
  const { inserted, load } = runBoot({ cookie: `otra=1; ${EU}` })
  assert.equal(inserted.length, 0)
  assert.equal(typeof load, 'function')
  load!()
  load!()
  assert.equal(inserted.length, 1)
})

test('"Solo esenciales": no carga ni fuera de la UE', () => {
  assert.equal(runBoot({ stored: 'essential' }).inserted.length, 0)
})

test('"Aceptar todo": carga también en la UE', () => {
  assert.equal(runBoot({ stored: 'all', cookie: EU }).inserted.length, 1)
})

test('almacenamiento bloqueado: cuenta como sin elegir', () => {
  assert.equal(runBoot({ storageThrows: true }).inserted.length, 1)
  assert.equal(runBoot({ storageThrows: true, cookie: EU }).inserted.length, 0)
})

test('panel y firma de contratos: nunca carga', () => {
  assert.equal(runBoot({ host: 'admin.bralto.io', stored: 'all' }).inserted.length, 0)
  assert.equal(runBoot({ path: '/c/contrato-123', stored: 'all' }).inserted.length, 0)
})

test('al rechazar se borran solo las cookies de medición y anuncios', () => {
  assert.deepEqual(
    trackingCookieNames(`_ga=1; _ga_ABC123=2; _gid=3; bralto_region=eu; _fbp=4; foo=bar; _gcl_au=5; _fbc=6; _gat_UA-1=7`),
    ['_ga', '_ga_ABC123', '_gid', '_fbp', '_gcl_au', '_fbc', '_gat_UA-1'],
  )
  assert.deepEqual(trackingCookieNames(''), [])
})
