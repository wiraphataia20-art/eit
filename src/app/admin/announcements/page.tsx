'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { Trash2, Plus, Clock, Pin, PinOff } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isPinned, setIsPinned] = useState(false)
  const [publishDate, setPublishDate] = useState('')
  const [publishTime, setPublishTime] = useState('08:00')
  const [loading, setLoading] = useState(false)

  async function fetchItems() {
    if (!isConfigured) return
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate(), eventDate: d.data().eventDate?.toDate() })))
  }

  useEffect(() => { fetchItems() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfigured) { alert('ต้องตั้งค่า Firebase ก่อน'); return }
    setLoading(true)
    try {
      let imageUrl = ''
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile)
      await addDoc(collection(db, 'announcements'), {
        title, content, imageUrl,
        eventDate: eventDate ? new Date(eventDate) : null,
        isPinned,
        publishAt: isPinned && publishDate ? new Date(`${publishDate}T${publishTime || '00:00'}`) : isPinned ? new Date() : null,
        createdAt: serverTimestamp(),
      })
      setTitle(''); setContent(''); setEventDate(''); setImageFile(null)
      setIsPinned(false); setPublishDate(''); setPublishTime('08:00')
      fetchItems()
    } catch (err: any) {
      alert(err.message)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!isConfigured) return
    await deleteDoc(doc(db, 'announcements', id))
    fetchItems()
  }

  async function handleTogglePin(id: string, current: boolean) {
    if (!isConfigured) return
    await updateDoc(doc(db, 'announcements', id), {
      isPinned: !current,
      publishAt: !current ? new Date() : null,
    })
    fetchItems()
  }

  function isExpired(item: any) {
    if (!item.eventDate) return false
    const expiry = new Date(item.eventDate)
    expiry.setDate(expiry.getDate() + 3)
    return new Date() > expiry
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">จัดการประกาศ</h1>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
          Dev mode — ต้องตั้งค่า Firebase ก่อนจึงจะบันทึกได้
        </div>
      )}

      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 p-6 mb-8 flex flex-col gap-4">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm"><Plus size={16} />เพิ่มประกาศใหม่</h2>
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="หัวข้อ"
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <textarea value={content} onChange={e => setContent(e.target.value)} required placeholder="เนื้อหา" rows={4}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} />วันที่กิจกรรม (ประกาศจะหายอัตโนมัติหลังจากนี้ 3 วัน)</label>
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="text-sm text-slate-500" />
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-4 h-4 accent-amber-500" />
          <span className="text-sm font-medium text-amber-700 flex items-center gap-1"><Pin size={13} />ประกาศสำคัญ (แสดงหน้าแรก)</span>
        </label>
        {isPinned && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} />แสดงหน้าแรกเมื่อ (ไม่ตั้งวันที่ = แสดงทันที)</label>
            <div className="flex gap-2">
              <input type="date" value={publishDate} onChange={e => setPublishDate(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              <input type="time" value={publishTime} onChange={e => setPublishTime(e.target.value)}
                className="w-32 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>
        )}
        <button type="submit" disabled={loading}
          className="bg-blue-700 text-white rounded-xl py-2 font-medium hover:bg-blue-800 transition disabled:opacity-50">
          {loading ? 'กำลังบันทึก...' : 'เพิ่มประกาศ'}
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {items.map(item => (
          <div key={item.id} className={`bg-white rounded-2xl border p-5 flex justify-between items-start ${isExpired(item) ? 'border-red-100 opacity-60' : item.isPinned ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-semibold text-slate-800">{item.title}</p>
                {item.isPinned && (
                  <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Pin size={9} />ประกาศสำคัญ
                  </span>
                )}
                {isExpired(item) && <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">หมดอายุแล้ว</span>}
              </div>
              <p className="text-sm text-slate-500">{item.content}</p>
              {item.eventDate && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock size={11} />วันกิจกรรม: {format(item.eventDate, 'dd MMM yyyy', { locale: th })}
                </p>
              )}
              {item.isPinned && item.publishAt && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <Clock size={11} />แสดงหน้าแรก: {format(item.publishAt?.toDate?.() || item.publishAt, 'dd MMM yyyy HH:mm', { locale: th })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <button onClick={() => handleTogglePin(item.id, item.isPinned)}
                className={`p-1.5 rounded-xl transition ${item.isPinned ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-100' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`}
                title={item.isPinned ? 'ยกเลิกประกาศสำคัญ' : 'ตั้งเป็นประกาศสำคัญ'}>
                {item.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
              <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 transition">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
