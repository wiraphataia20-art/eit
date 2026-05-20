import Link from 'next/link'
import { cookies } from 'next/headers'
import { Megaphone, Calendar, ImageIcon, BookOpen, Users, ArrowRight } from 'lucide-react'
import PinnedAnnouncement from '@/components/PinnedAnnouncement'
import HeroVideo from '@/components/HeroVideo'

const publicSections = [
  { href: '/announcements', icon: Megaphone, label: 'Announcements', sub: 'ประกาศกิจกรรม' },
  { href: '/calendar', icon: Calendar, label: 'Calendar', sub: 'ปฏิทินกิจกรรม' },
  { href: '/gallery', icon: ImageIcon, label: 'Gallery', sub: 'แกลเลอรี่รูปภาพ' },
  { href: '/team', icon: Users, label: 'Team', sub: 'ทีมงานสโมสร' },
]

const worksSection = { href: '/works', icon: BookOpen, label: 'Works', sub: 'คลังผลงาน' }

export default async function Home() {
  const session = (await cookies()).get('session')?.value
  const sections = session ? [...publicSections, worksSection] : publicSections

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-[#0D0608]">
        <HeroVideo />
        {/* Bottom fade to page background */}

        <div className="relative max-w-6xl mx-auto px-6 py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-[#7B1113]/50 text-[#E05555] text-xs font-mono px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C41E20] animate-pulse inline-block" />
            Engineering &amp; Industrial Technology · PSRU
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Student Union
          </h1>
          <p className="text-white/65 text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม<br />
            มหาวิทยาลัยราชภัฏพิบูลสงคราม
          </p>

          <Link href="/announcements"
            className="inline-flex items-center gap-2 bg-[#7B1113] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#9B1416] transition-all duration-200 shadow-lg shadow-[#7B1113]/30">
            ดูประกาศล่าสุด <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      <PinnedAnnouncement />

      {/* Menu */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-slate-100 dark:bg-[#2D1214]" />
          <span className="text-xs font-mono text-slate-400 dark:text-slate-600 tracking-[0.2em] uppercase">Menu</span>
          <div className="h-px flex-1 bg-slate-100 dark:bg-[#2D1214]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(({ href, icon: Icon, label, sub }) => (
            <Link key={href} href={href}
              className="group bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 hover:border-[#7B1113]/30 dark:hover:border-[#7B1113]/50 hover:shadow-lg hover:shadow-[#7B1113]/5 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200"
                style={{ background: 'rgba(123,17,19,0.08)' }}>
                <Icon size={20} className="text-[#7B1113]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-wide">{label}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
              </div>
              <ArrowRight size={15} className="text-slate-200 dark:text-slate-700 group-hover:text-[#7B1113] group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
