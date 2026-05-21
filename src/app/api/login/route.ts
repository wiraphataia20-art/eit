import { NextRequest, NextResponse } from 'next/server'
import { signSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { role } = await req.json()

  if (!['admin', 'member'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const token = await signSession(role)
  const res = NextResponse.json({ ok: true })

  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 86400,
    path: '/',
  })

  return res
}
