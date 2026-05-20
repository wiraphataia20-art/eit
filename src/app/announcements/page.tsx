'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Megaphone, Clock, X, Calendar } from 'lucide-react'

const DEV_DATA = [
  { id: '1', title: 'ตัวอย่างประกาศ', content: 'นี่คือตัวอย่างประกาศของสโมสร', imageUrl: '', createdAt: new Date() },
]

export default function AnnouncementsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    async function fetch() {
      if (!isConfigured) { setItems(DEV_DATA); setLoading(false); return }
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const now = new Date()
      const all = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate(), eventDate: d.data().eventDate?.toDate() }))
      setItems(all.filter(item => {
        if (!item.eventDate) return true
        const expiry = new Date(item.eventDate)
        expiry.setDate(expiry.getDate() + 3)
        return now <= expiry
      }))
      setLoading(false)
    }
    fetch()
  }, [])

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
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
        <div className="flex flex-col gap-4">
          {items.map(item => (
            <article key={item.id}
              onClick={() => setSelected(item)}
              className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden hover:shadow-md hover:border-[#7B1113]/20 transition-all duration-300 flex cursor-pointer">
              {item.imageUrl && (
                <div className="w-36 shrink-0">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 flex-wrap">
                  <Clock size={12} />
                  {item.createdAt ? format(item.createdAt, 'dd MMMM yyyy', { locale: th }) : ''}
                  {item.eventDate && (
                    <span className="bg-red-50 text-[#7B1113] px-2 py-0.5 rounded-full">
                      กิจกรรม {format(item.eventDate, 'dd MMM yyyy', { locale: th })}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1">{item.title}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">{item.content}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            {selected.imageUrl && (
              <img src={selected.imageUrl} alt={selected.title} className="w-full h-52 object-cover rounded-t-2xl" />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex flex-wrap gap-2">
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
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{selected.title}</h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">{selected.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
