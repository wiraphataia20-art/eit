'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { Users, User, X, ExternalLink } from 'lucide-react'

const CONTACT_COLORS: Record<string, { bg: string; text: string }> = {
  Line: { bg: 'bg-green-500', text: 'text-white' },
  Instagram: { bg: 'bg-pink-500', text: 'text-white' },
  Facebook: { bg: 'bg-blue-600', text: 'text-white' },
  'อีเมล': { bg: 'bg-slate-500', text: 'text-white' },
  'อื่นๆ': { bg: 'bg-slate-400', text: 'text-white' },
}

function getContactHref(type: string, value: string) {
  if (!value) return null
  if (type === 'Line') return `https://line.me/ti/p/~${value}`
  if (type === 'Instagram') return `https://instagram.com/${value.replace('@', '')}`
  if (type === 'Facebook') return `https://facebook.com/${value}`
  if (type === 'อีเมล') return `mailto:${value}`
  return null
}

function MemberCard({ member, size = 'sm', isHead = false, onClick }: {
  member: any, size?: 'sm' | 'lg', isHead?: boolean, onClick: () => void
}) {
  const imgSize = size === 'lg' ? 'w-24 h-24' : 'w-16 h-16'
  const nameSize = size === 'lg' ? 'text-base' : 'text-sm'
  const padding = size === 'lg' ? 'p-6' : 'p-4'

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800/50 rounded-2xl border flex flex-col items-center text-center gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${padding} ${isHead ? 'border-rose-200 dark:border-rose-800 ring-1 ring-rose-100 dark:ring-rose-900/50' : 'border-slate-100 dark:border-slate-700/50'}`}
    >
      {isHead && (
        <span className="text-xs font-semibold bg-rose-500 text-white px-2.5 py-0.5 rounded-full -mt-1">หัวหน้าฝ่าย</span>
      )}
      {member.imageUrl ? (
        <img src={member.imageUrl} alt={member.name}
          className={`${imgSize} rounded-full object-cover ring-4 ${isHead ? 'ring-rose-100 dark:ring-rose-900/50' : 'ring-slate-50 dark:ring-slate-700'}`} />
      ) : (
        <div className={`${imgSize} rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center text-rose-300 ring-4 ring-slate-50 dark:ring-slate-700`}>
          <User size={size === 'lg' ? 32 : 22} />
        </div>
      )}
      <div className="w-full">
        <p className={`font-bold text-slate-800 dark:text-white ${nameSize}`}>{member.name}</p>
        <p className="text-xs text-rose-500 font-medium mt-0.5">{member.position}</p>
        {member.major && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{member.major}</p>
        )}
      </div>
    </div>
  )
}

function MemberModal({ member, onClose }: { member: any, onClose: () => void }) {
  const href = member.contactValue ? getContactHref(member.contactType, member.contactValue) : null
  const contactStyle = CONTACT_COLORS[member.contactType] || CONTACT_COLORS['อื่นๆ']

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          {member.imageUrl ? (
            <img src={member.imageUrl} alt={member.name}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-rose-100 dark:ring-rose-900/50 shadow-md" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center text-rose-300 ring-4 ring-slate-100 dark:ring-slate-700">
              <User size={44} />
            </div>
          )}

          <div className="w-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{member.name}</h3>
            <p className="text-sm text-rose-500 font-medium mt-0.5">{member.position}</p>
            {member.department && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{member.department}</p>
            )}
          </div>

          {(member.major || member.yearLevel) && (
            <div className="flex flex-wrap justify-center gap-2">
              {member.major && (
                <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">
                  {member.major}
                </span>
              )}
              {member.yearLevel && (
                <span className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-full">
                  {member.yearLevel}
                </span>
              )}
            </div>
          )}

          {member.bio && (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3 w-full">
              &ldquo;{member.bio}&rdquo;
            </p>
          )}

          {member.contactValue && (
            <div className="w-full pt-1">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center gap-2 ${contactStyle.bg} ${contactStyle.text} rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition`}
                >
                  <ExternalLink size={14} />
                  {member.contactType}: {member.contactValue}
                </a>
              ) : (
                <div className={`w-full flex items-center justify-center gap-2 ${contactStyle.bg} ${contactStyle.text} rounded-xl py-2.5 text-sm font-medium`}>
                  {member.contactType}: {member.contactValue}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMember, setSelectedMember] = useState<any | null>(null)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    const q = query(collection(db, 'teamMembers'), orderBy('order', 'asc'))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMembers(data)
      setSelectedYear(prev => {
        if (prev) return prev
        const years = [...new Set(data.map((m: any) => m.academicYear).filter(Boolean))].sort().reverse()
        return years.length > 0 ? (years[0] as string) : ''
      })
      setLoading(false)
    }, () => {
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ')
      setLoading(false)
    })
    return unsub
  }, [retryKey])

  const years = [...new Set(members.map(m => m.academicYear).filter(Boolean))].sort().reverse() as string[]
  const filtered = members.filter(m => m.academicYear === selectedYear)

  const executives = filtered.filter(m => m.group === 'บริหาร')
  const deptMembers = filtered.filter(m => m.group === 'ฝ่าย')

  const deptMap: Record<string, { heads: any[], members: any[] }> = {}
  deptMembers.forEach(m => {
    const dept = m.department || 'ไม่ระบุฝ่าย'
    if (!deptMap[dept]) deptMap[dept] = { heads: [], members: [] }
    if (m.position === 'หัวหน้าฝ่าย') deptMap[dept].heads.push(m)
    else deptMap[dept].members.push(m)
  })

  const president = executives.find(m => m.position === 'ประธานสโมสร')
  const others = executives.filter(m => m.position !== 'ประธานสโมสร')

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
          <Users size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">ทีมงาน</h1>
          <p className="text-sm text-slate-500">คณะกรรมการสโมสรนักศึกษา</p>
        </div>
      </div>

      {years.length > 1 && (
        <div className="flex gap-2 mb-10 flex-wrap">
          {years.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                selectedYear === y
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-200 hover:text-rose-600'
              }`}>
              ปีการศึกษา {y}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-24 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="mb-4">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); setRetryKey(k => k + 1) }}
            className="text-sm text-rose-500 hover:underline">ลองใหม่</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีข้อมูลทีมงาน</p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {executives.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-rose-500 rounded-full inline-block" />
                คณะกรรมการบริหาร
              </h2>
              {president && (
                <div className="flex justify-center mb-6">
                  <div className="w-56">
                    <MemberCard member={president} size="lg" onClick={() => setSelectedMember(president)} />
                  </div>
                </div>
              )}
              {others.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {others.map(m => <MemberCard key={m.id} member={m} size="sm" onClick={() => setSelectedMember(m)} />)}
                </div>
              )}
            </section>
          )}

          {Object.entries(deptMap).map(([dept, { heads, members: dMembers }]) => (
            <section key={dept}>
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
                {dept}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {heads.map(m => <MemberCard key={m.id} member={m} size="sm" isHead onClick={() => setSelectedMember(m)} />)}
                {dMembers.map(m => <MemberCard key={m.id} member={m} size="sm" onClick={() => setSelectedMember(m)} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedMember && (
        <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  )
}
