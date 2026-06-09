'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { Megaphone, ArrowRight, ChevronDown, X } from 'lucide-react'
import Link from 'next/link'

const MAX_PINNED = 3

export default function PinnedAnnouncement() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function loadPinned() {
      if (!isConfigured) return
      const q = query(collection(db, 'announcements'), where('isPinned', '==', true))
      const snap = await getDocs(q)
      const now = new Date()
      const valid = snap.docs
        .map(d => ({ id: d.id, ...d.data(), publishAt: d.data().publishAt?.toDate() }))
        .filter(a => !a.publishAt || a.publishAt <= now)
        .sort((a, b) => (b.publishAt?.getTime() ?? 0) - (a.publishAt?.getTime() ?? 0))
        .slice(0, MAX_PINNED)
      setAnnouncements(valid)
    }
    loadPinned()
  }, [])

  const visible = announcements.filter(a => !dismissed.has(a.id))

  if (visible.length === 0) return null

  function dismiss(id: string) {
    setDismissed(prev => new Set(prev).add(id))
    setExpanded(prev => (prev === id ? null : prev))
  }

  return (
    <div className="w-full">
      {visible.map((announcement, index) => (
        <div key={announcement.id}>
          {/* Alert bar */}
          <div className={`bg-gradient-to-r shadow-lg ${index === 0 ? 'from-red-700 via-rose-700 to-red-800' : 'from-red-800 via-rose-800 to-red-900'}`}>
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
              {/* Pulsing icon — only on first */}
              <div className="relative shrink-0">
                {index === 0 && <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />}
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
                onClick={() => setExpanded(prev => prev === announcement.id ? null : announcement.id)}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
              >
                ดูเพิ่มเติม
                <ChevronDown size={13} className={`transition-transform duration-300 ${expanded === announcement.id ? 'rotate-180' : ''}`} />
              </button>

              {/* Dismiss */}
              <button
                onClick={() => dismiss(announcement.id)}
                className="shrink-0 text-white/50 hover:text-white transition-colors ml-1"
                aria-label="ปิด"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Expanded card */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded === announcement.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
              <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 rounded-2xl shadow-xl shadow-red-900/10 p-5 flex flex-col">
                {/* Header + scrollable content */}
                <div className="flex items-start justify-between gap-4 min-h-0">
                  <div className="flex-1 min-w-0 overflow-y-auto max-h-64 pr-1">
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
                    onClick={() => setExpanded(null)}
                    className="shrink-0 text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 transition-colors mt-0.5"
                    aria-label="ปิด"
                  >
                    <X size={16} />
                  </button>
                </div>
                {/* Footer always visible */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end shrink-0">
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
      ))}
    </div>
  )
}
