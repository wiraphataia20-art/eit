import Link from 'next/link'
import { Megaphone, Calendar, ImageIcon, BookOpen, Users, UserCircle, Bell, Info } from 'lucide-react'

const sections = [
  { href: '/admin/announcements', icon: Megaphone, label: 'จัดการประกาศ', gradient: 'from-blue-500 to-blue-600' },
  { href: '/admin/calendar', icon: Calendar, label: 'จัดการปฏิทิน', gradient: 'from-emerald-500 to-teal-600' },
  { href: '/admin/gallery', icon: ImageIcon, label: 'จัดการแกลเลอรี่', gradient: 'from-amber-400 to-orange-500' },
  { href: '/admin/works', icon: BookOpen, label: 'จัดการคลังงาน', gradient: 'from-violet-500 to-purple-600' },
  { href: '/admin/team', icon: Users, label: 'จัดการทีมงาน', gradient: 'from-rose-500 to-pink-600' },
  { href: '/admin/members', icon: UserCircle, label: 'จัดการสมาชิก', gradient: 'from-indigo-500 to-blue-600' },
  { href: '/admin/notices', icon: Bell, label: 'ประกาศหน้าแรก', gradient: 'from-amber-400 to-orange-500' },
  { href: '/admin/about', icon: Info, label: 'เกี่ยวกับสโมสร', gradient: 'from-[#7B1113] to-[#9B1416]' },
]

export default function DashboardPage() {
  return (
    <div>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sections.map(({ href, icon: Icon, label, gradient }) => (
            <Link key={href} href={href}
              className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                <Icon size={20} className="text-white" />
              </div>
              <span className="font-semibold text-slate-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
