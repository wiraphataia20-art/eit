'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { Megaphone, ArrowRight, ChevronDown, X } from 'lucide-react'
import Link from 'next/link'

export default function PinnedAnnouncement() {
  const [announcement, setAnnouncement] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)

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
    <div className="w-full">
      {/* Alert bar */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Pulsing icon */}
          <div className="relative shrink-0">
            <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
            <div className="relative w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Megaphone size={16} className="text-white" />
            </div>
          </div>

          {/* Badge */}
          <span className="shrink-0 text-xs font-bold bg-white text-red-700 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            ประกาศสำคัญ
          </span>

          {/* Divider */}
          <span className="text-white/40 shrink-0">•</span>

          {/* Title */}
          <p className="flex-1 min-w-0 text-sm font-semibold text-white truncate">
            {announcement.title}
          </p>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
          >
            ดูเพิ่มเติม
            <ChevronDown size={13} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 text-white/50 hover:text-white transition-colors ml-1"
            aria-label="ปิด"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Expanded card */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
          <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 rounded-2xl shadow-xl shadow-red-900/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug mb-2">
                  {announcement.title}
                </p>
                {announcement.content && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                    {announcement.content}
                  </p>
                )}
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="shrink-0 text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 transition-colors mt-0.5"
                aria-label="ปิด"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <Link
                href="/announcements"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
              >
                ไปยังหน้าประกาศทั้งหมด <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
