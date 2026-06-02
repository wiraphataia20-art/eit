'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { Phone, Mail, MessageCircle, Globe, AtSign } from 'lucide-react'

const DEV_DATA = {
  history: 'สโมสรนักศึกษาคณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
  vision: 'มุ่งพัฒนานักศึกษาให้มีคุณภาพและคุณธรรม',
  mission: 'ส่งเสริมกิจกรรมที่เป็นประโยชน์ต่อนักศึกษาและสังคม',
  contactPhone: '', contactEmail: '', contactLine: '',
  contactFacebook: '', contactInstagram: '',
}

export default function AboutPage() {
  const [data, setData] = useState<any>(DEV_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    const unsub = onSnapshot(doc(db, 'config', 'about'), snap => {
      if (snap.exists()) setData(snap.data())
      setLoading(false)
    }, () => {
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ')
      setLoading(false)
    })
    return unsub
  }, [retryKey])

  const contacts = [
    { icon: Phone, label: 'โทรศัพท์', value: data.contactPhone, href: `tel:${data.contactPhone}` },
    { icon: Mail, label: 'อีเมล', value: data.contactEmail, href: `mailto:${data.contactEmail}` },
    { icon: MessageCircle, label: 'Line', value: data.contactLine, href: `https://line.me/ti/p/~${data.contactLine}` },
    { icon: Globe, label: 'Facebook', value: data.contactFacebook, href: `https://facebook.com/${data.contactFacebook}` },
    { icon: AtSign, label: 'Instagram', value: data.contactInstagram, href: `https://instagram.com/${data.contactInstagram}` },
  ].filter(c => c.value)

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-4 border-[#7B1113]/20 border-t-[#7B1113] rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="text-center py-32 text-slate-400">
      <p className="mb-4">{error}</p>
      <button onClick={() => { setError(null); setLoading(true); setRetryKey(k => k + 1) }}
        className="text-sm text-[#7B1113] hover:underline">ลองใหม่</button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <img src="/logo.png" alt="SMO" className="w-10 h-10 object-contain" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">เกี่ยวกับสโมสร</h1>
          <p className="text-sm text-slate-500">คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม · PSRU</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Logo + name */}
        <div className="bg-gradient-to-br from-[#7B1113] to-[#9B1416] rounded-2xl p-8 flex flex-col items-center text-center gap-4 shadow-lg shadow-[#7B1113]/20">
          <img src="/logo.png" alt="SMO" className="w-20 h-20 object-contain drop-shadow-lg" />
          <div>
            <h2 className="text-xl font-bold text-white">สโมสรนักศึกษา</h2>
            <p className="text-white/80 text-sm mt-1">คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม</p>
            <p className="text-white/60 text-xs mt-0.5">มหาวิทยาลัยราชภัฏพิบูลสงคราม</p>
          </div>
        </div>

        {/* History */}
        {data.history && (
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#7B1113] rounded-full inline-block" />
              ประวัติสโมสร
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{data.history}</p>
          </div>
        )}

        {/* Vision & Mission */}
        {(data.vision || data.mission) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.vision && (
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6">
                <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
                  วิสัยทัศน์
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{data.vision}</p>
              </div>
            )}
            {data.mission && (
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6">
                <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-1 h-5 bg-emerald-500 rounded-full inline-block" />
                  พันธกิจ
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{data.mission}</p>
              </div>
            )}
          </div>
        )}

        {/* Contact */}
        {contacts.length > 0 && (
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-violet-500 rounded-full inline-block" />
              ติดต่อสโมสร
            </h3>
            <div className="flex flex-col gap-3">
              {contacts.map(({ icon: Icon, label, value, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition group">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center shadow-sm shrink-0">
                    <Icon size={16} className="text-[#7B1113] dark:text-[#E05555]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-[#7B1113] dark:group-hover:text-[#E05555] transition">{value}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
