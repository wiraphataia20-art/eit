'use client'

import { signOut } from 'firebase/auth'
import { auth, isConfigured } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { LogOut, UserCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function MemberHeader() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!isConfigured) { setEmail('member@test.com'); return }
    const unsub = auth.onAuthStateChanged(user => setEmail(user?.email ?? null))
    return () => unsub()
  }, [])

  async function handleLogout() {
    if (isConfigured) await signOut(auth)
    document.cookie = 'session=; path=/; max-age=0'
    router.push('/admin/login')
  }

  return (
    <div className="flex items-center justify-between bg-white border-b border-slate-100 px-6 py-3">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <UserCircle size={16} />
        <span>{email ?? '...'}</span>
        <span className="bg-violet-100 text-violet-600 text-xs font-medium px-2 py-0.5 rounded-full">สมาชิก</span>
      </div>
      <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition">
        <LogOut size={15} />ออกจากระบบ
      </button>
    </div>
  )
}
