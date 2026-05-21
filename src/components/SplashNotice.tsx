'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { X, Megaphone, Wrench, Star, ImageIcon } from 'lucide-react'

const TYPE_CONFIG: Record<string, { label: string; bar: string; badge: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  'ประกาศสำคัญ': { label: 'ประกาศสำคัญ', bar: 'bg-amber-400', badge: 'bg-amber-500', icon: Megaphone },
  'แจ้งปิดปรับปรุง': { label: 'แจ้งปิดปรับปรุง', bar: 'bg-slate-500', badge: 'bg-slate-600', icon: Wrench },
  'วันสำคัญ': { label: 'วันสำคัญ', bar: 'bg-emerald-400', badge: 'bg-emerald-500', icon: Star },
  'โปสเตอร์': { label: 'โปสเตอร์', bar: 'bg-violet-400', badge: 'bg-violet-500', icon: ImageIcon },
}

const DEFAULT_DURATION = 12

export default function SplashNotice() {
  const [notice, setNotice] = useState<any>(null)
  const [visible, setVisible] = useState(false)
  const [total, setTotal] = useState(DEFAULT_DURATION)
  const [countdown, setCountdown] = useState(DEFAULT_DURATION)

  useEffect(() => {
    if (!isConfigured) return
    const q = query(collection(db, 'notices'), where('isActive', '==', true))
    const unsub = onSnapshot(q, snap => {
      const now = new Date()
      const active = snap.docs
        .map(d => ({
          id: d.id, ...d.data(),
          startDate: d.data().startDate?.toDate?.() ?? null,
          endDate: d.data().endDate?.toDate?.() ?? null,
        }))
        .filter(n => {
          if (n.startDate && n.startDate > now) return false
          if (n.endDate && n.endDate < now) return false
          return true
        })
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))

      if (active.length === 0) return

      const top = active[0]
      try {
        const seen: string[] = JSON.parse(sessionStorage.getItem('seen_notices') || '[]')
        if (seen.includes(top.id)) return
      } catch {}

      const dur = top.duration && top.duration > 0 ? top.duration : DEFAULT_DURATION
      setNotice(top)
      setTotal(dur)
      setCountdown(dur)
      setVisible(true)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!visible || !notice) return
    const timeout = setTimeout(() => dismiss(notice), total * 1000)
    const interval = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000)
    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [visible, notice, total])

  function dismiss(n: any) {
    try {
      const seen: string[] = JSON.parse(sessionStorage.getItem('seen_notices') || '[]')
      if (n && !seen.includes(n.id)) {
        sessionStorage.setItem('seen_notices', JSON.stringify([...seen, n.id]))
      }
    } catch {}
    setVisible(false)
  }

  if (!visible || !notice) return null

  const cfg = TYPE_CONFIG[notice.type] || TYPE_CONFIG['ประกาศสำคัญ']
  const TypeIcon = cfg.icon
  const progress = (countdown / total) * 100

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={() => dismiss(notice)}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Countdown progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-1 ${cfg.bar} transition-all duration-1000 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {notice.imageUrl ? (
          /* Poster mode — image is the hero */
          <>
            <div className="relative">
              <img
                src={notice.imageUrl}
                alt={notice.title}
                className="w-full max-h-[65vh] object-contain bg-black"
              />
              {(notice.title || notice.description) && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <span className={`text-xs font-bold ${cfg.badge} text-white px-2.5 py-0.5 rounded-full inline-block mb-2`}>
                      {cfg.label}
                    </span>
                    {notice.title && (
                      <p className="font-bold text-white text-base leading-snug">{notice.title}</p>
                    )}
                    {notice.description && (
                      <p className="text-sm text-white/80 mt-1 leading-relaxed">{notice.description}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          /* Text mode */
          <div className="p-6">
            <div className="flex items-start gap-4 pr-2">
              <div className={`w-11 h-11 rounded-2xl ${cfg.badge} flex items-center justify-center shrink-0 shadow-sm`}>
                <TypeIcon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-bold ${cfg.badge} text-white px-2.5 py-0.5 rounded-full inline-block mb-2`}>
                  {cfg.label}
                </span>
                <h3 className="font-bold text-slate-800 dark:text-white text-base leading-snug">{notice.title}</h3>
                {notice.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed whitespace-pre-line">
                    {notice.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            ปิดอัตโนมัติใน {countdown} วินาที
          </span>
          <button
            onClick={() => dismiss(notice)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition"
          >
            <X size={13} /> ข้าม
          </button>
        </div>
      </div>
    </div>
  )
}
