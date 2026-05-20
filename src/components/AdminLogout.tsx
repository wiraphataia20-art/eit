'use client'

import { signOut } from 'firebase/auth'
import { auth, isConfigured } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function AdminLogout() {
  const router = useRouter()

  async function handleLogout() {
    if (isConfigured) await signOut(auth)
    document.cookie = 'session=; path=/; max-age=0'
    router.push('/admin/login')
  }

  return (
    <button onClick={handleLogout}
      className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition px-3 py-2 rounded-xl hover:bg-red-50">
      <LogOut size={15} />ออกจากระบบ
    </button>
  )
}
