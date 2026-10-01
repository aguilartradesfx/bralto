// Los bloques con datos pendientes ([Dato real], [Testimonio real]…) se revisan en
// desarrollo y en previews de Vercel. En producción, o ante un entorno que no
// reconocemos, se ocultan: falla cerrado.
type Env = Record<string, string | undefined>

export function showPending(env: Env): boolean {
  if (env.VERCEL_ENV) return env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'development'
  return env.NODE_ENV === 'development'
}
