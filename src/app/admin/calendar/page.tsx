'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export default function AdminCalendarPage() {
  const [items, setItems] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [type, setType] = useState('activity')
  const [loading, setLoading] = useState(false)

  async function fetchItems() {
    if (!isConfigured) return
    const q = query(collection(db, 'events'), orderBy('startDate', 'asc'))
    const snap = await getDocs(q)
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data(), startDate: d.data().startDate?.toDate(), endDate: d.data().endDate?.toDate() })))
  }

  useEffect(() => { fetchItems() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfigured) { alert('ต้องตั้งค่า Firebase ก่อน'); return }
    setLoading(true)
    try {
      await addDoc(collection(db, 'events'), {
        title, description, type,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : null,
        createdAt: serverTimestamp(),
      })
      setTitle(''); setDescription(''); setStartDate(''); setEndDate(''); setType('activity')
      fetchItems()
    } catch (err: any) {
      alert(err.message)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!isConfigured) return
    await deleteDoc(doc(db, 'events', id))
    fetchItems()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">จัดการปฏิทิน</h1>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
          Dev mode — ต้องตั้งค่า Firebase ก่อนจึงจะบันทึกได้
        </div>
      )}

      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 p-6 mb-8 flex flex-col gap-4">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm"><Plus size={16} />เพิ่มกิจกรรม</h2>
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="ชื่อกิจกรรม"
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="รายละเอียด" rows={3}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <div>
          <label className="text-xs text-slate-500 mb-1 block">ประเภทกิจกรรม</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="activity">กิจกรรม</option>
            <option value="important">วันสำคัญ</option>
            <option value="meeting">ประชุม</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">วันเริ่มต้น</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">วันสิ้นสุด (ไม่บังคับ)</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="bg-blue-700 text-white rounded-xl py-2 font-medium hover:bg-blue-800 transition disabled:opacity-50">
          {loading ? 'กำลังบันทึก...' : 'เพิ่มกิจกรรม'}
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex justify-between items-start">
            <div>
              <p className="font-semibold text-slate-800">{item.title}</p>
              {item.startDate && (
                <p className="text-sm text-emerald-600 mt-1">
                  {format(item.startDate, 'dd MMM yyyy', { locale: th })}
                  {item.endDate && ` — ${format(item.endDate, 'dd MMM yyyy', { locale: th })}`}
                </p>
              )}
            </div>
            <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 transition ml-4">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
