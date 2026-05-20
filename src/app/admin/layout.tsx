'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import AdminLogout from '@/components/AdminLogout'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'
  const isDashboard = pathname === '/admin/dashboard'

  if (isLoginPage) return <>{children}</>

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ colorScheme: 'light' }}>
      <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {!isDashboard && (
            <Link href="/admin/dashboard"
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition">
              <ChevronLeft size={16} />Dashboard
            </Link>
          )}
          {isDashboard && (
            <div>
              <p className="text-sm font-bold text-slate-800">Admin Dashboard</p>
              <p className="text-xs text-slate-400">สโมสรนักศึกษา</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isDashboard && (
            <Link href="/" className="text-sm text-slate-500 hover:text-blue-600 transition">
              ดูเว็บไซต์
            </Link>
          )}
          <AdminLogout />
        </div>
      </div>
      {children}
    </div>
  )
}
