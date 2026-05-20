'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import { th } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getHolidaysForYear } from '@/lib/holidays'

const DEV_DATA = [
  { id: '1', title: 'กิจกรรมตัวอย่าง', description: 'รายละเอียดกิจกรรม', startDate: new Date(), endDate: null, type: 'activity' },
]

const TYPE_CONFIG: Record<string, { label: string; color: string; dot: string; darkColor: string }> = {
  activity: { label: 'กิจกรรม', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500', darkColor: 'dark:bg-violet-900/40 dark:text-violet-300' },
  holiday: { label: 'วันหยุด', color: 'bg-red-100 text-[#7B1113]', dot: 'bg-[#7B1113]', darkColor: 'dark:bg-[#7B1113]/20 dark:text-[#E05555]' },
  important: { label: 'วันสำคัญ', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', darkColor: 'dark:bg-emerald-900/40 dark:text-emerald-300' },
  meeting: { label: 'ประชุม', color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500', darkColor: 'dark:bg-sky-900/40 dark:text-sky-300' },
  other: { label: 'อื่นๆ', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', darkColor: 'dark:bg-slate-700/50 dark:text-slate-400' },
}

export default function CalendarPage() {
  const [firestoreItems, setFirestoreItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    async function fetch() {
      if (!isConfigured) { setFirestoreItems(DEV_DATA); setLoading(false); return }
      const q = query(collection(db, 'events'), orderBy('startDate', 'asc'))
      const snap = await getDocs(q)
      setFirestoreItems(snap.docs.map(d => ({
        id: d.id, ...d.data(),
        startDate: d.data().startDate?.toDate(),
        endDate: d.data().endDate?.toDate(),
      })))
      setLoading(false)
    }
    fetch()
  }, [])

  const holidays = getHolidaysForYear(currentMonth.getFullYear())
  const items = [...firestoreItems, ...holidays]

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startPad = getDay(startOfMonth(currentMonth))

  function eventsOnDay(day: Date) {
    return items.filter(item => {
      if (!item.startDate) return false
      if (isSameDay(item.startDate, day)) return true
      if (item.endDate && item.startDate <= day && day <= item.endDate) return true
      return false
    })
  }

  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : []

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7B1113] to-[#9B1416] flex items-center justify-center shadow-sm">
          <Calendar size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">ปฏิทินกิจกรรม</h1>
          <p className="text-sm text-slate-500">กิจกรรมและวันสำคัญของสโมสร</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <span key={key} className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${cfg.color} ${cfg.darkColor}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden shadow-sm">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#7B1113]/15 dark:border-[#7B1113]/20">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition text-slate-500 dark:text-slate-400">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-bold text-slate-800 dark:text-white text-lg">
            {format(currentMonth, 'MMMM yyyy', { locale: th })}
          </h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition text-slate-500 dark:text-slate-400">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[#7B1113]/15 dark:border-[#7B1113]/20">
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d, i) => (
            <div key={d} className={`text-center text-xs font-semibold py-3 ${i === 0 ? 'text-[#7B1113] dark:text-[#E05555]' : 'text-slate-400 dark:text-slate-500'}`}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#7B1113]/20 border-t-[#7B1113] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[80px] border-b border-r border-[#7B1113]/10 dark:border-[#7B1113]/15" />
            ))}
            {days.map(day => {
              const dayEvents = eventsOnDay(day)
              const isToday = isSameDay(day, new Date())
              const hasEvents = dayEvents.length > 0
              const isSunday = getDay(day) === 0
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => hasEvents && setSelectedDay(day)}
                  className={`min-h-[80px] border-b border-r border-[#7B1113]/10 dark:border-[#7B1113]/15 p-2 flex flex-col transition-colors ${hasEvents ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30' : ''}`}
                >
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 transition-colors
                    ${isToday ? 'bg-[#7B1113] text-white shadow-sm' : isSunday ? 'text-[#7B1113] dark:text-[#E05555]' : 'text-slate-700 dark:text-slate-300'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.slice(0, 2).map(ev => {
                      const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.other
                      return (
                        <span key={ev.id} className={`text-xs px-1.5 py-0.5 rounded-md truncate ${cfg.color} ${cfg.darkColor}`}>
                          {ev.title}
                        </span>
                      )
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 px-1">+{dayEvents.length - 2}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedDay && selectedEvents.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setSelectedDay(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest mb-0.5">กิจกรรมวันนี้</p>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                  {format(selectedDay, 'dd MMMM yyyy', { locale: th })}
                </h3>
              </div>
              <button onClick={() => setSelectedDay(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {selectedEvents.map(ev => {
                const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.other
                return (
                  <div key={ev.id} className={`rounded-xl p-4 ${cfg.color} ${cfg.darkColor}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="text-xs font-semibold tracking-wide">{cfg.label}</span>
                    </div>
                    <p className="font-bold text-sm">{ev.title}</p>
                    {ev.description && <p className="text-xs mt-1 opacity-75 leading-relaxed">{ev.description}</p>}
                    {ev.endDate && (
                      <p className="text-xs mt-1.5 opacity-60">
                        ถึง {format(ev.endDate, 'dd MMM yyyy', { locale: th })}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
