'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LogOut } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth, isConfigured } from '@/lib/firebase'
import ThemeToggle from '@/components/ThemeToggle'

const baseLinks = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/announcements', label: 'ประกาศ' },
  { href: '/calendar', label: 'ปฏิทิน' },
  { href: '/gallery', label: 'แกลเลอรี่' },
  { href: '/team', label: 'ทีมงาน' },
  { href: '/about', label: 'เกี่ยวกับ' },
]

function getSession() {
  const match = document.cookie.match(/ui_role=([^;]+)/)
  return match ? match[1] : null
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [session, setSession] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => { setSession(getSession()) }, [pathname])

  const links = session
    ? [...baseLinks.slice(0, 4), { href: '/works', label: 'คลังงาน' }, baseLinks[4]]
    : baseLinks

  async function handleLogout() {
    if (isConfigured) await signOut(auth)
    await fetch('/api/logout', { method: 'POST' })
    setSession(null)
    router.push('/')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isAdmin = pathname.startsWith('/admin')
  if (isAdmin) return null

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md dark:shadow-black/30'
        : 'bg-white dark:bg-slate-900 shadow-sm dark:shadow-none border-b border-transparent dark:border-slate-800/60'
    }`}>
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="SMO" className="w-9 h-9 object-contain" />
          <span className="text-lg font-extrabold tracking-widest text-slate-800 dark:text-white">SMO</span>
        </Link>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition" onClick={() => setOpen(!open)}>
            {open ? <X size={22} className="text-slate-700 dark:text-slate-300" /> : <Menu size={22} className="text-slate-700 dark:text-slate-300" />}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link key={link.href} href={link.href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === link.href
                  ? 'bg-red-50 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E05555] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-slate-800 dark:hover:text-white'
              }`}>
              {link.label}
            </Link>
          ))}

          {session && (
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-100 dark:border-slate-800">
              {session === 'admin' ? (
                <Link href="/admin/dashboard"
                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#7B1113] text-white hover:bg-[#9B1416] transition">
                  Admin
                </Link>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E05555]">
                  Member
                </span>
              )}
              <button onClick={handleLogout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                <LogOut size={15} />
              </button>
            </div>
          )}

          <div className="ml-1 pl-2 border-l border-slate-100 dark:border-slate-800">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 dark:border-slate-800 px-4 py-3 flex flex-col gap-1 bg-white dark:bg-slate-900">
          {links.map(link => (
            <Link key={link.href} href={link.href}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                pathname === link.href
                  ? 'bg-red-50 dark:bg-[#7B1113]/20 text-[#7B1113] dark:text-[#E05555] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/8'
              }`}
              onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
