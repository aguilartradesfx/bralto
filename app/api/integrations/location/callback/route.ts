import { handleOauthCallback } from '@/lib/ghl/callback-handler'

export async function GET(req: Request) {
  return handleOauthCallback(req, 'subaccount')
}
