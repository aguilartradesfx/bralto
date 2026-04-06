import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// VERCEL_ENV is automatically 'production' on Vercel prod deployments.
// Locally (npm run dev) it is undefined, so pages are fully accessible.
export function middleware(request: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/servicios/:path*', '/precios'],
}
