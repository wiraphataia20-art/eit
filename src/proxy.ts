import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const session = request.cookies.get('session')?.value

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (session !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  if (pathname === '/works') {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/works'],
}
