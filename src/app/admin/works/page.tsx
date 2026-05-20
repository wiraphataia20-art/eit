'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { uploadFileToSupabase } from '@/lib/supabase'
import { Trash2, Plus, ExternalLink, Upload, Link } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export default function AdminWorksPage() {
  const [items, setItems] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [inputMode, setInputMode] = useState<'upload' | 'link'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [driveUrl, setDriveUrl] = useState('')
  const [loading, setLoading] = useState(false)

  async function fetchItems() {
    if (!isConfigured) return
    const q = query(collection(db, 'works'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() })))
  }

  useEffect(() => { fetchItems() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfigured) { alert('ต้องตั้งค่า Firebase ก่อน'); return }
    setLoading(true)
    try {
      let fileUrl = ''
      if (inputMode === 'upload' && file) {
        fileUrl = await uploadFileToSupabase(file)
      } else if (inputMode === 'link' && driveUrl) {
        const cleanUrl = driveUrl.split('?')[0].trim()
        if (!cleanUrl.startsWith('https://drive.google.com/') && !cleanUrl.startsWith('https://docs.google.com/')) {
          alert('ลิงก์ต้องเป็น Google Drive หรือ Google Docs')
          setLoading(false)
          return
        }
        fileUrl = cleanUrl
      }
      await addDoc(collection(db, 'works'), {
        title, description, category, fileUrl,
        createdAt: serverTimestamp(),
      })
      setTitle(''); setDescription(''); setCategory(''); setFile(null); setDriveUrl('')
      fetchItems()
    } catch (err: any) { alert(err.message) }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!isConfigured) return
    await deleteDoc(doc(db, 'works', id))
    fetchItems()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">จัดการคลังงาน</h1>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
          Dev mode — ต้องตั้งค่า Firebase ก่อนจึงจะบันทึกได้
        </div>
      )}

      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 p-6 mb-8 flex flex-col gap-4">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm"><Plus size={16} />เพิ่มงานใหม่</h2>
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="ชื่องาน"
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="รายละเอียด" rows={3}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <input value={category} onChange={e => setCategory(e.target.value)} placeholder="หมวดหมู่ (เช่น กิจกรรม, โปรเจค)"
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
          <button type="button" onClick={() => setInputMode('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 transition ${inputMode === 'upload' ? 'bg-blue-700 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Upload size={14} />อัปโหลดไฟล์
          </button>
          <button type="button" onClick={() => setInputMode('link')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 transition ${inputMode === 'link' ? 'bg-blue-700 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Link size={14} />ลิงก์ Google Drive
          </button>
        </div>

        {inputMode === 'upload' ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">ไฟล์ PDF, Word, PowerPoint ฯลฯ</label>
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
            {file && <p className="text-xs text-blue-600">เลือกไฟล์: {file.name}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">ลิงก์ Google Drive / Docs / Sheets / Slides</label>
            <input value={driveUrl} onChange={e => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        )}

        <button type="submit" disabled={loading}
          className="bg-blue-700 text-white rounded-xl py-2 font-medium hover:bg-blue-800 transition disabled:opacity-50">
          {loading ? 'กำลังบันทึก...' : 'เพิ่มงาน'}
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800">{item.title}</p>
              {item.description && <p className="text-sm text-slate-500 mt-1">{item.description}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {item.category && <span className="text-xs bg-violet-100 text-violet-600 px-2 py-1 rounded-full">{item.category}</span>}
                {item.createdAt && <span className="text-xs text-slate-400">{format(item.createdAt, 'dd MMM yyyy', { locale: th })}</span>}
              </div>
              {item.fileUrl && (
                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-2">
                  <ExternalLink size={11} />เปิดไฟล์
                </a>
              )}
            </div>
            <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 transition ml-4 shrink-0">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
