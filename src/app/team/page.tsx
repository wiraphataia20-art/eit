'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { Users, User, Link } from 'lucide-react'

const CONTACT_COLORS: Record<string, string> = {
  Line: 'bg-green-50 text-green-600',
  Instagram: 'bg-pink-50 text-pink-600',
  Facebook: 'bg-blue-50 text-blue-700',
  'อีเมล': 'bg-slate-50 text-slate-600',
  'อื่นๆ': 'bg-slate-50 text-slate-600',
}

function getContactHref(type: string, value: string) {
  if (!value) return null
  if (type === 'Line') return `https://line.me/ti/p/~${value}`
  if (type === 'Instagram') return `https://instagram.com/${value.replace('@', '')}`
  if (type === 'Facebook') return `https://facebook.com/${value}`
  if (type === 'อีเมล') return `mailto:${value}`
  return null
}

function MemberCard({ member, size = 'sm', isHead = false }: { member: any, size?: 'sm' | 'lg', isHead?: boolean }) {
  const imgSize = size === 'lg' ? 'w-24 h-24' : 'w-16 h-16'
  const nameSize = size === 'lg' ? 'text-base' : 'text-sm'
  const padding = size === 'lg' ? 'p-6' : 'p-4'

  const contact = member.contactValue ? (() => {
    const href = getContactHref(member.contactType, member.contactValue)
    const colorClass = CONTACT_COLORS[member.contactType] || 'bg-slate-50 text-slate-600'
    const badge = (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-2 ${colorClass}`}>
        <Link size={9} />{member.contactType}: {member.contactValue}
      </span>
    )
    return href
      ? <a href={href} target="_blank" rel="noopener noreferrer" className="block">{badge}</a>
      : <div>{badge}</div>
  })() : null

  return (
    <div className={`bg-white rounded-2xl border flex flex-col items-center text-center gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${padding} ${isHead ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-100'}`}>
      {isHead && (
        <span className="text-xs font-semibold bg-rose-500 text-white px-2.5 py-0.5 rounded-full -mt-1">หัวหน้าฝ่าย</span>
      )}
      {member.imageUrl ? (
        <img src={member.imageUrl} alt={member.name}
          className={`${imgSize} rounded-full object-cover ring-4 ${isHead ? 'ring-rose-100' : 'ring-slate-50'}`} />
      ) : (
        <div className={`${imgSize} rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-rose-300 ring-4 ring-slate-50`}>
          <User size={size === 'lg' ? 32 : 22} />
        </div>
      )}
      <div className="w-full">
        <p className={`font-bold text-slate-800 ${nameSize}`}>{member.name}</p>
        <p className="text-xs text-rose-500 font-medium mt-0.5">{member.position}</p>
        {contact}
      </div>
    </div>
  )
}

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState('')

  useEffect(() => {
    async function fetchData() {
      if (!isConfigured) { setLoading(false); return }
      const q = query(collection(db, 'teamMembers'), orderBy('order', 'asc'))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMembers(data)
      const years = [...new Set(data.map((m: any) => m.academicYear).filter(Boolean))].sort().reverse()
      if (years.length > 0) setSelectedYear(years[0] as string)
      setLoading(false)
    }
    fetchData()
  }, [])

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
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
          <Users size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ทีมงาน</h1>
          <p className="text-sm text-slate-500">คณะกรรมการสโมสรนักศึกษา</p>
        </div>
      </div>

      {/* Year Tabs */}
      {years.length > 1 && (
        <div className="flex gap-2 mb-10 flex-wrap">
          {years.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                selectedYear === y
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600'
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีข้อมูลทีมงาน</p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">

          {/* Executive Section */}
          {executives.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-rose-500 rounded-full inline-block" />
                คณะกรรมการบริหาร
              </h2>
              {president && (
                <div className="flex justify-center mb-6">
                  <div className="w-56">
                    <MemberCard member={president} size="lg" />
                  </div>
                </div>
              )}
              {others.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {others.map(m => <MemberCard key={m.id} member={m} size="sm" />)}
                </div>
              )}
            </section>
          )}

          {/* Department Sections */}
          {Object.entries(deptMap).map(([dept, { heads, members: dMembers }]) => (
            <section key={dept}>
              <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
                {dept}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {heads.map(m => <MemberCard key={m.id} member={m} size="sm" isHead />)}
                {dMembers.map(m => <MemberCard key={m.id} member={m} size="sm" />)}
              </div>
            </section>
          ))}

        </div>
      )}
    </div>
  )
}
