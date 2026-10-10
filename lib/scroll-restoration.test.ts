import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { scrollRestorationScript } from './scroll-restoration.ts'

type Env = { noScrollRestoration?: boolean }

// Ejecuta el script inline del <head> con la URL con la que llega una visita de un anuncio
function runBoot(env: Env = {}) {
  const urlChanges: string[] = []
  const history: Record<string, unknown> = {
    replaceState: (_state: unknown, _title: string, url?: string) => urlChanges.push(`replaceState ${url}`),
    pushState: (_state: unknown, _title: string, url?: string) => urlChanges.push(`pushState ${url}`),
  }
  if (!env.noScrollRestoration) history.scrollRestoration = 'auto'
  const sandbox: Record<string, unknown> = {
    history,
    location: { pathname: '/es', search: '?utm_source=google&gclid=abc', hash: '#como-funciona' },
    scrollTo: () => {},
  }
  sandbox.window = sandbox
  vm.runInNewContext(scrollRestorationScript, sandbox)
  return { history, urlChanges }
}

test('no toca la URL: la query (UTM, gclid, retorno de pagos) y el #ancla quedan intactos', () => {
  assert.deepEqual(runBoot().urlChanges, [])
})

test('cada carga completa arranca arriba: desactiva la restauración del scroll', () => {
  assert.equal(runBoot().history.scrollRestoration, 'manual')
})

test('navegador sin history.scrollRestoration: no falla', () => {
  assert.doesNotThrow(() => runBoot({ noScrollRestoration: true }))
})
