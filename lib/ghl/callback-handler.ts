import { NextResponse } from 'next/server'
import { exchangeAuthCode, saveTokens, GhlAuthError, type AppKind } from '@/lib/ghl/client'

function defaultRedirectUri(req: Request, kind: AppKind): string {
  const url = new URL(req.url)
  return `${url.origin}/api/integrations/${kind === 'agency' ? 'agency' : 'location'}/callback`
}

export async function handleOauthCallback(req: Request, kind: AppKind): Promise<Response> {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) return NextResponse.json({ ok: false, error }, { status: 400 })
  if (!code) return NextResponse.json({ ok: false, error: 'Missing ?code' }, { status: 400 })

  const envOverride =
    kind === 'agency'
      ? process.env.HIGHLEVEL_AGENCY_REDIRECT_URI
      : process.env.HIGHLEVEL_SUBACCOUNT_REDIRECT_URI
  const redirectUri = envOverride ?? defaultRedirectUri(req, kind)

  try {
    const token = await exchangeAuthCode(kind, code, redirectUri)
    const stored = await saveTokens(kind, token)

    const successUrl = new URL('/admin', url.origin)
    successUrl.searchParams.set('integration', kind)
    successUrl.searchParams.set('company', stored.company_id)
    if (stored.location_id) successUrl.searchParams.set('location', stored.location_id)
    return NextResponse.redirect(successUrl)
  } catch (err) {
    const message = err instanceof GhlAuthError ? err.message : 'OAuth exchange failed'
    console.error(`[integrations:${kind}] callback error:`, err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
