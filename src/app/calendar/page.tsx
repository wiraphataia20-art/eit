'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dateFnsLocalizer, Calendar: BigCalendar, Views } = require('react-big-calendar')
import { format, parse, startOfWeek, getDay, addDays, isSameDay } from 'date-fns'
import { th } from 'date-fns/locale'
import { getHolidaysForYear } from '@/lib/holidays'
import { Calendar, X } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 0 }),
  getDay,
  locales: { 'th-TH': th },
})

const TYPE_CONFIG: Record<string, { label: string; bg: string }> = {
  activity: { label: 'กิจกรรม',   bg: '#7C3AED' },
  holiday:  { label: 'วันหยุด',   bg: '#7B1113' },
  important:{ label: 'วันสำคัญ',  bg: '#059669' },
  meeting:  { label: 'ประชุม',    bg: '#0284C7' },
  other:    { label: 'อื่นๆ',     bg: '#64748B' },
}

const MESSAGES = {
  today: 'วันนี้',
  previous: '‹',
  next: '›',
  month: 'เดือน',
  week: 'สัปดาห์',
  day: 'วัน',
  agenda: 'รายการ',
  date: 'วันที่',
  time: 'เวลา',
  event: 'กิจกรรม',
  noEventsInRange: 'ไม่มีกิจกรรมในช่วงนี้',
  showMore: (total: number) => `+${total} รายการ`,
}

export default function CalendarPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState<string>(Views.MONTH)
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    const q = query(collection(db, 'events'), orderBy('startDate', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => {
        const data = d.data()
        const startDate: Date = data.startDate?.toDate()
        const endDate: Date | null = data.endDate?.toDate() ?? null
        return {
          id: d.id,
          title: data.title,
          description: data.description ?? '',
          type: data.type ?? 'other',
          start: startDate,
          end: endDate ?? startDate,
          allDay: true,
        }
      }))
      setLoading(false)
    })
    return unsub
  }, [])

  const holidays = getHolidaysForYear(date.getFullYear()).map(h => ({
    id: h.id,
    title: h.title,
    description: '',
    type: h.type,
    start: h.startDate,
    end: h.startDate,
    allDay: true,
  }))

  const events = [...items, ...holidays]

  function eventStyleGetter(event: any) {
    const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.other
    return {
      style: {
        backgroundColor: cfg.bg,
        border: 'none',
        borderRadius: '5px',
        color: '#fff',
        fontSize: '12px',
        padding: '1px 6px',
      },
    }
  }

  const selectedDisplayEnd = selected?.end
    ? isSameDay(selected.start, selected.end)
      ? null
      : addDays(selected.end, -1)
    : null
  const showRange = selectedDisplayEnd && !isSameDay(selected.start, selectedDisplayEnd)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <style>{`
        /* ── Light mode ─────────────────────────────── */
        .rbc-calendar { font-family: inherit; }
        .rbc-toolbar { margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
        .rbc-toolbar button {
          border-radius: 10px; border: 1px solid #e2e8f0; color: #475569;
          padding: 6px 14px; font-size: 13px; cursor: pointer; background: #fff; transition: all 0.15s; }
        .rbc-toolbar button:hover { background: #f8fafc; border-color: #7B1113; color: #7B1113; }
        .rbc-toolbar button.rbc-active,
        .rbc-toolbar button.rbc-active:hover { background: #7B1113 !important; color: #fff !important; border-color: #7B1113 !important; }
        .rbc-toolbar-label { font-weight: 700; font-size: 18px; color: #1e293b; }
        .rbc-header { padding: 10px 4px; font-size: 12px; font-weight: 600;
          color: #94a3b8; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
        .rbc-header + .rbc-header { border-left: 1px solid #f1f5f9; }
        .rbc-today { background: #fff7f7 !important; }
        .rbc-date-cell { padding: 4px 6px; font-size: 13px; }
        .rbc-date-cell > button { color: #475569; }
        .rbc-date-cell.rbc-now > button { background: #7B1113; color: #fff;
          border-radius: 50%; width: 26px; height: 26px; display: inline-flex;
          align-items: center; justify-content: center; font-weight: 700; }
        .rbc-off-range-bg { background: #f8fafc; }
        .rbc-off-range > button { color: #cbd5e1 !important; }
        .rbc-month-view { border: 1px solid #f1f5f9; border-radius: 16px; overflow: hidden; background: #fff; }
        .rbc-month-row { min-height: 160px; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid #f1f5f9; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #f1f5f9; }
        .rbc-event { cursor: pointer; }
        .rbc-event:focus { outline: none; box-shadow: none; }
        .rbc-show-more { color: #7B1113; font-size: 11px; font-weight: 600; background: transparent; padding: 0 6px; }
        .rbc-event-label { display: none; }

        /* ── Dark mode ──────────────────────────────── */
        .dark .rbc-toolbar button {
          background: #1e293b; border-color: #334155; color: #94a3b8; }
        .dark .rbc-toolbar button:hover {
          background: #1e293b; border-color: #7B1113; color: #E05555; }
        .dark .rbc-toolbar button.rbc-active,
        .dark .rbc-toolbar button.rbc-active:hover {
          background: #7B1113 !important; color: #fff !important; border-color: #7B1113 !important; }
        .dark .rbc-toolbar-label { color: #f1f5f9; }
        .dark .rbc-month-view {
          background: #1e293b; border-color: #334155; }
        .dark .rbc-header {
          background: #0f172a; color: #64748b; border-bottom-color: #334155; }
        .dark .rbc-header + .rbc-header { border-left-color: #334155; }
        .dark .rbc-today { background: #2d1214 !important; }
        .dark .rbc-date-cell > button { color: #94a3b8; }
        .dark .rbc-date-cell.rbc-now > button { background: #7B1113; color: #fff; }
        .dark .rbc-off-range-bg { background: #0f172a; }
        .dark .rbc-off-range > button { color: #334155 !important; }
        .dark .rbc-month-row + .rbc-month-row { border-top-color: #334155; }
        .dark .rbc-day-bg + .rbc-day-bg { border-left-color: #334155; }
        .dark .rbc-show-more { color: #E05555; }
        .dark .rbc-popup {
          background: #1e293b; border-color: #334155; border-radius: 12px; }
        .dark .rbc-popup-header { color: #f1f5f9; border-bottom-color: #334155; }
      `}</style>

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
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(TYPE_CONFIG).map(([, cfg]) => (
          <span key={cfg.label}
            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.bg }} />
            {cfg.label}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#7B1113]/20 border-t-[#7B1113] rounded-full animate-spin" />
        </div>
      ) : (
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          allDayAccessor="allDay"
          style={{ height: 820 }}
          date={date}
          view={view}
          onNavigate={(d: Date) => { setDate(d) }}
          onView={(v: string) => setView(v)}
          culture="th-TH"
          messages={MESSAGES}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(ev: any) => setSelected(ev)}
          popup
          popupOffset={10}
        />
      )}

      {/* Event detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full"
                  style={{ background: (TYPE_CONFIG[selected.type] ?? TYPE_CONFIG.other).bg }} />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {(TYPE_CONFIG[selected.type] ?? TYPE_CONFIG.other).label}
                </span>
              </div>
              <button onClick={() => setSelected(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <X size={16} />
              </button>
            </div>

            <h3 className="font-bold text-xl text-slate-800 mb-3 leading-snug">{selected.title}</h3>

            <p className="text-sm text-slate-500">
              {format(selected.start, 'dd MMMM yyyy', { locale: th })}
              {showRange && (
                <> — {format(selectedDisplayEnd!, 'dd MMMM yyyy', { locale: th })}</>
              )}
            </p>

            {selected.description && (
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{selected.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
