'use client'

import { useEffect, useState } from 'react'
import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, updateDoc } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { Bell, Trash2, Plus, X, Eye, EyeOff, ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

const TYPES = ['ประกาศสำคัญ', 'แจ้งปิดปรับปรุง', 'วันสำคัญ', 'โปสเตอร์']

const TYPE_COLOR: Record<string, string> = {
  'ประกาศสำคัญ': 'bg-amber-100 text-amber-700',
  'แจ้งปิดปรับปรุง': 'bg-slate-100 text-slate-600',
  'วันสำคัญ': 'bg-emerald-100 text-emerald-700',
  'โปสเตอร์': 'bg-violet-100 text-violet-700',
}

function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; ok: boolean }[]>([])
  function show(msg: string, ok = true) {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, ok }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }
  return { toasts, show }
}

function ToastContainer({ toasts }: { toasts: { id: number; msg: string; ok: boolean }[] }) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${t.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {t.ok ? '✓' : '✕'} {t.msg}
        </div>
      ))}
    </div>
  )
}

export default function AdminNoticesPage() {
  const { toasts, show } = useToast()
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('ประกาศสำคัญ')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [duration, setDuration] = useState(12)

  useEffect(() => {
    if (!isConfigured) return
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setNotices(snap.docs.map(d => ({
        id: d.id, ...d.data(),
        startDate: d.data().startDate?.toDate?.() ?? null,
        endDate: d.data().endDate?.toDate?.() ?? null,
        createdAt: d.data().createdAt?.toDate?.() ?? null,
      })))
    })
    return unsub
  }, [])

  function handleImageChange(file: File | null) {
    setImagePreview(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    setImageFile(file)
    if (file) setImagePreview(URL.createObjectURL(file))
  }

  function resetForm() {
    setTitle(''); setDescription(''); setType('ประกาศสำคัญ')
    setImageFile(null); setImagePreview(null); setStartDate(''); setEndDate('')
    setDuration(12); setShowForm(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfigured) { show('ต้องตั้งค่า Firebase ก่อน', false); return }
    setLoading(true)
    try {
      let imageUrl = ''
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile)
      await addDoc(collection(db, 'notices'), {
        title: title.trim(),
        description: description.trim(),
        type, imageUrl, isActive: true,
        duration: Number(duration),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdAt: new Date(),
      })
      resetForm()
      show('เพิ่มประกาศสำเร็จ')
    } catch (err: any) { show(err.message, false) }
    setLoading(false)
  }

  async function toggleActive(notice: any) {
    if (!isConfigured) return
    await updateDoc(doc(db, 'notices', notice.id), { isActive: !notice.isActive })
    show(notice.isActive ? 'ซ่อนประกาศแล้ว' : 'เปิดแสดงประกาศแล้ว')
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบประกาศนี้?')) return
    await deleteDoc(doc(db, 'notices', id))
    show('ลบประกาศแล้ว')
  }

  const activeCount = notices.filter(n => n.isActive).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <ToastContainer toasts={toasts} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">ประกาศหน้าแรก</h1>
            <p className="text-xs text-slate-400 mt-0.5">Splash notice แสดงเมื่อผู้เข้าชมเปิดเว็บ</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(p => !p); if (showForm) resetForm() }}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-800 transition"
        >
          {showForm ? <><X size={14} /> ยกเลิก</> : <><Plus size={14} /> เพิ่มประกาศ</>}
        </button>
      </div>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
          Dev mode — ต้องตั้งค่า Firebase ก่อนจึงจะบันทึกได้
        </div>
      )}

      {activeCount > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          กำลังแสดงอยู่ {activeCount} ประกาศ — ผู้เข้าชมใหม่จะเห็น Splash notice
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 mb-6 shadow-sm">
          <h2 className="font-semibold text-slate-700 text-sm border-b border-slate-100 pb-3">เพิ่มประกาศใหม่</h2>

          {/* Type selector */}
          <div className="flex gap-2 flex-wrap">
            {TYPES.map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${type === t ? 'bg-blue-700 text-white border-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                {t}
              </button>
            ))}
          </div>

          <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="หัวข้อประกาศ *"
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)" rows={3}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />

          {/* Duration */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-500 whitespace-nowrap">ปิดอัตโนมัติหลัง</label>
            <input
              type="number" min={5} max={60} value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-20 border border-slate-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-xs text-slate-500">วินาที</span>
            <div className="flex gap-1 ml-auto">
              {[8, 12, 15, 20, 30].map(s => (
                <button key={s} type="button" onClick={() => setDuration(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${duration === s ? 'bg-blue-700 text-white border-blue-700' : 'border-slate-200 text-slate-400 hover:border-blue-300'}`}>
                  {s}s
                </button>
              ))}
            </div>
          </div>

          {/* Image upload */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-500 flex items-center gap-1">
              <ImageIcon size={11} /> รูปภาพ / โปสเตอร์ (ไม่บังคับ — ถ้ามีรูปจะแสดงเป็น Poster mode)
            </label>
            <input type="file" accept="image/*" onChange={e => handleImageChange(e.target.files?.[0] || null)}
              className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
            {imagePreview && (
              <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                <img src={imagePreview} alt="preview" className="max-h-48 object-contain" />
                <button type="button" onClick={() => handleImageChange(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Date range */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs text-slate-500">เริ่มแสดง (ไม่บังคับ)</label>
              <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs text-slate-500">หมดอายุ (ไม่บังคับ)</label>
              <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="bg-blue-700 text-white rounded-xl py-2.5 font-medium hover:bg-blue-800 transition disabled:opacity-50 text-sm">
            {loading ? 'กำลังบันทึก...' : 'บันทึกประกาศ'}
          </button>
        </form>
      )}

      {/* Notice list */}
      <div className="flex flex-col gap-3">
        {notices.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Bell size={36} className="mx-auto mb-3 opacity-25" />
            <p className="text-sm">ยังไม่มีประกาศ</p>
            <p className="text-xs mt-1 text-slate-300">กดปุ่ม "เพิ่มประกาศ" เพื่อสร้างใหม่</p>
          </div>
        ) : notices.map(n => (
          <div key={n.id}
            className={`bg-white rounded-2xl border p-5 flex gap-4 items-start transition-opacity ${n.isActive ? 'border-slate-100' : 'border-slate-100 opacity-50'}`}>
            {n.imageUrl && (
              <img src={n.imageUrl} alt={n.title} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_COLOR[n.type] || 'bg-slate-100 text-slate-600'}`}>
                  {n.type}
                </span>
                <span className={`text-xs font-medium flex items-center gap-1 ${n.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${n.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                  {n.isActive ? 'กำลังแสดง' : 'ซ่อน'}
                </span>
              </div>
              <p className="font-semibold text-slate-800 text-sm">{n.title}</p>
              {n.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.description}</p>
              )}
              <p className="text-xs text-slate-300 mt-1.5 flex flex-wrap gap-x-3">
                {n.duration && <span>⏱ {n.duration} วินาที</span>}
                {n.startDate ? <span>เริ่ม {format(n.startDate, 'dd MMM yyyy HH:mm', { locale: th })}</span> : null}
                {n.endDate ? <span>หมดอายุ {format(n.endDate, 'dd MMM yyyy HH:mm', { locale: th })}</span> : null}
                {!n.startDate && !n.endDate && n.createdAt ? <span>สร้าง {format(n.createdAt, 'dd MMM yyyy', { locale: th })}</span> : null}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toggleActive(n)} title={n.isActive ? 'ซ่อน' : 'แสดง'}
                className={`transition p-1 rounded-lg ${n.isActive ? 'text-emerald-500 hover:text-slate-400 hover:bg-slate-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-slate-50'}`}>
                {n.isActive ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
              <button onClick={() => handleDelete(n.id)} title="ลบ"
                className="text-red-300 hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50">
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
