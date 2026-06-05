import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/session'
import { adminAuth } from '@/lib/firebase-admin'

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  const role = token ? await verifySession(token) : null
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { uid } = await req.json()
  if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 })

  try {
    await adminAuth.deleteUser(uid)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
