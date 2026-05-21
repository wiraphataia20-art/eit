'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Megaphone, Clock, X, Calendar, ChevronRight, ExternalLink, Paperclip } from 'lucide-react'

const TYPE_STYLE: Record<string, string> = {
  'กิจกรรม':       'bg-blue-50 text-blue-600 border-blue-100',
  'ทุนการศึกษา':   'bg-emerald-50 text-emerald-600 border-emerald-100',
  'ประชาสัมพันธ์': 'bg-violet-50 text-violet-600 border-violet-100',
  'ข่าวทั่วไป':    'bg-slate-50 text-slate-500 border-slate-200',
}

const DEV_DATA = [
  { id: '1', title: 'ตัวอย่างประกาศ', content: 'นี่คือตัวอย่างประกาศของสโมสร', imageUrl: '', announcementType: 'ข่าวทั่วไป', createdAt: new Date() },
]

/* Auto-detect URLs and render as clickable links */
function RichContent({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  return (
    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-blue-500 underline underline-offset-2 hover:text-blue-700 break-all">
            {part}
          </a>
        ) : part
      )}
    </p>
  )
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    if (!isConfigured) { setItems(DEV_DATA); setLoading(false); return }
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const now = new Date()
      const all = snap.docs.map(d => ({
        id: d.id, ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
        eventDate: d.data().eventDate?.toDate(),
      }))
      setItems(all.filter(item => {
        if (!item.eventDate) return true
        const expiry = new Date(item.eventDate)
        expiry.setDate(expiry.getDate() + 3)
        return now <= expiry
      }))
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7B1113] to-[#9B1416] flex items-center justify-center shadow-sm">
          <Megaphone size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">ประกาศกิจกรรม</h1>
          <p className="text-sm text-slate-500">ข่าวสารและกิจกรรมล่าสุดของสโมสร</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#7B1113]/20 border-t-[#7B1113] rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีประกาศในขณะนี้</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => {
            const typeStyle = TYPE_STYLE[item.announcementType] || TYPE_STYLE['ข่าวทั่วไป']
            return (
              <article key={item.id} onClick={() => setSelected(item)}
                className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden hover:shadow-md hover:border-[#7B1113]/20 transition-all duration-200 cursor-pointer group flex items-center gap-0">

                {/* Thumbnail */}
                <div className="w-20 h-20 shrink-0 bg-slate-50 dark:bg-slate-800 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Megaphone size={22} className="text-slate-200" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {item.announcementType && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${typeStyle}`}>
                        {item.announcementType}
                      </span>
                    )}
                    {item.createdAt && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {format(item.createdAt, 'dd MMM yyyy', { locale: th })}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-white leading-snug line-clamp-2">
                    {item.title}
                  </h2>
                </div>

                <ChevronRight size={16} className="text-slate-300 group-hover:text-[#7B1113] transition-colors shrink-0 mr-4" />
              </article>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {selected.imageUrl && (
              <img src={selected.imageUrl} alt={selected.title}
                className="w-full h-56 object-cover rounded-t-2xl" />
            )}

            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {selected.announcementType && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${TYPE_STYLE[selected.announcementType] || TYPE_STYLE['ข่าวทั่วไป']}`}>
                      {selected.announcementType}
                    </span>
                  )}
                  {selected.createdAt && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={11} />
                      {format(selected.createdAt, 'dd MMMM yyyy', { locale: th })}
                    </span>
                  )}
                  {selected.eventDate && (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-[#7B1113] px-2 py-0.5 rounded-full">
                      <Calendar size={10} />
                      กิจกรรม {format(selected.eventDate, 'dd MMMM yyyy', { locale: th })}
                    </span>
                  )}
                </div>
                <button onClick={() => setSelected(null)}
                  className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                  <X size={18} />
                </button>
              </div>

              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 leading-snug">
                {selected.title}
              </h2>

              <RichContent text={selected.content || ''} />

              {/* Content images */}
              {selected.contentImages?.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">รูปภาพ</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.contentImages.map((url: string, i: number) => (
                      <img key={i} src={url} alt={`รูป ${i + 1}`}
                        className="w-full rounded-xl object-cover border border-slate-100 cursor-pointer hover:opacity-90 transition"
                        onClick={e => { e.stopPropagation(); window.open(url, '_blank') }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selected.attachments?.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                    <Paperclip size={11} />ไฟล์แนบ
                  </p>
                  <div className="flex flex-col gap-2">
                    {selected.attachments.map((a: any, i: number) => (
                      <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition group">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <Paperclip size={14} className="text-slate-400" />
                        </div>
                        <span className="flex-1 text-sm text-slate-700 truncate">{a.name || `ไฟล์ ${i + 1}`}</span>
                        <ExternalLink size={13} className="text-slate-300 group-hover:text-blue-500 transition shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
