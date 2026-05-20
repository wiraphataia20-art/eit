'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { Megaphone, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'

export default function PinnedAnnouncement() {
  const [announcement, setAnnouncement] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function fetch() {
      if (!isConfigured) return
      const q = query(collection(db, 'announcements'), where('isPinned', '==', true))
      const snap = await getDocs(q)
      const now = new Date()
      const valid = snap.docs
        .map(d => ({ id: d.id, ...d.data(), publishAt: d.data().publishAt?.toDate() }))
        .filter(a => !a.publishAt || a.publishAt <= now)
        .sort((a, b) => (b.publishAt?.getTime() ?? 0) - (a.publishAt?.getTime() ?? 0))
      if (valid.length > 0) setAnnouncement(valid[0])
    }
    fetch()
  }, [])

  if (!announcement || dismissed) return null

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
          <Megaphone size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full inline-block mb-1.5">ประกาศสำคัญ</span>
          <p className="font-bold text-slate-800">{announcement.title}</p>
          {announcement.content && (
            <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{announcement.content}</p>
          )}
          <Link href="/announcements"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition mt-2">
            ดูรายละเอียด <ArrowRight size={11} />
          </Link>
        </div>
        <button onClick={() => setDismissed(true)}
          className="text-slate-300 hover:text-slate-500 transition shrink-0 mt-0.5">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
