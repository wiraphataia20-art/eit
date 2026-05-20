import Link from 'next/link'
import { cookies } from 'next/headers'
function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
    </svg>
  )
}

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/smoeit.psru?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
    icon: InstagramIcon,
    color: 'hover:text-pink-400',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/smotechno',
    icon: FacebookIcon,
    color: 'hover:text-blue-400',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@smofeit_psru?is_from_webapp=1&sender_device=pc',
    icon: TikTokIcon,
    color: 'hover:text-white',
  },
]

export default async function Footer() {
  const session = (await cookies()).get('session')?.value
  return (
    <footer className="bg-[#0D0608] dark:bg-black/40 border-t border-[#2D1214]/60 text-slate-400 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="SMO" className="w-8 h-8 object-contain opacity-90" />
          <div>
            <p className="text-white font-bold text-sm tracking-widest">SMO</p>
            <p className="text-xs text-slate-600">© 2026 · Engineering &amp; Industrial Technology</p>
          </div>
        </div>

        {/* Social Media */}
        <div className="flex items-center gap-5">
          {SOCIALS.map(({ label, href, icon: Icon, color }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-1.5 text-slate-500 ${color} transition-colors duration-200`}
              aria-label={label}>
              <Icon size={18} />
              <span className="text-xs font-medium hidden sm:inline">{label}</span>
            </a>
          ))}
        </div>

        <Link href="/admin/login" className="text-xs text-slate-700 hover:text-slate-400 transition">
          Admin
        </Link>
      </div>
    </footer>
  )
}
