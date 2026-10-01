import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { THEME_STORAGE_KEY, themeBootScript } from './theme.ts'

type Env = {
  stored?: string | null
  storageThrows?: boolean
  prefersLight?: boolean
  noMatchMedia?: boolean
}

// Ejecuta el script inline tal como lo hace el navegador: hijo directo del
// contenedor del home, antes del primer pintado.
function runBoot(env: Env) {
  const root = { dataset: {} as Record<string, string> }
  const reads: string[] = []
  const sandbox: Record<string, unknown> = {
    document: { currentScript: { parentElement: root } },
    localStorage: {
      getItem(key: string) {
        reads.push(key)
        if (env.storageThrows) throw new Error('SecurityError')
        return env.stored ?? null
      },
    },
  }
  if (!env.noMatchMedia) {
    sandbox.matchMedia = (q: string) => ({ matches: q === '(prefers-color-scheme: light)' && !!env.prefersLight })
  }
  sandbox.window = sandbox
  vm.runInNewContext(themeBootScript, sandbox)
  return { theme: root.dataset.theme, reads }
}

test('tema guardado gana sobre la preferencia del sistema', () => {
  assert.equal(runBoot({ stored: 'light', prefersLight: false }).theme, 'light')
  assert.equal(runBoot({ stored: 'dark', prefersLight: true }).theme, 'dark')
})

test('sin tema guardado sigue a prefers-color-scheme', () => {
  assert.equal(runBoot({ prefersLight: true }).theme, 'light')
  assert.equal(runBoot({ prefersLight: false }).theme, 'dark')
})

test('un valor guardado inválido se ignora', () => {
  assert.equal(runBoot({ stored: 'blue', prefersLight: true }).theme, 'light')
  assert.equal(runBoot({ stored: '', prefersLight: false }).theme, 'dark')
})

test('almacenamiento bloqueado (modo privado) no rompe: usa el sistema', () => {
  assert.equal(runBoot({ storageThrows: true, prefersLight: true }).theme, 'light')
})

test('navegador sin matchMedia: oscuro por defecto', () => {
  assert.equal(runBoot({ noMatchMedia: true }).theme, 'dark')
})

test('lee la preferencia con la clave del home', () => {
  assert.deepEqual(runBoot({ stored: 'light' }).reads, [THEME_STORAGE_KEY])
})
