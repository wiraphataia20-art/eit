'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { Trash2, Plus, FolderOpen } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export default function AdminGalleryPage() {
  const [albums, setAlbums] = useState<any[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [driveFolderUrl, setDriveFolderUrl] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchAlbums() {
    if (!isConfigured) return
    const q = query(collection(db, 'albums'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setAlbums(snap.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate() })))
  }

  useEffect(() => { fetchAlbums() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfigured) { alert('ต้องตั้งค่า Firebase ก่อน'); return }
    const cleanUrl = driveFolderUrl.split('?')[0].trim()
    if (!cleanUrl.startsWith('https://drive.google.com/')) {
      alert('ลิงก์ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://drive.google.com/')
      return
    }
    setLoading(true)
    try {
      let coverUrl = ''
      if (coverFile) coverUrl = await uploadToCloudinary(coverFile)
      await addDoc(collection(db, 'albums'), {
        name, description, driveFolderUrl: cleanUrl, coverUrl,
        date: date ? new Date(date) : null,
        createdAt: serverTimestamp(),
      })
      setName(''); setDescription(''); setDate(''); setDriveFolderUrl(''); setCoverFile(null)
      fetchAlbums()
    } catch (err: any) { alert(err.message) }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!isConfigured) return
    await deleteDoc(doc(db, 'albums', id))
    fetchAlbums()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">จัดการแกลเลอรี่</h1>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
          Dev mode — ต้องตั้งค่า Firebase ก่อนจึงจะบันทึกได้
        </div>
      )}

      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 flex flex-col gap-4">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm"><Plus size={16} />สร้างอัลบั้มใหม่</h2>

        <input value={name} onChange={e => setName(e.target.value)} required placeholder="ชื่อกิจกรรม / งาน"
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />

        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="รายละเอียด (ไม่บังคับ)" rows={2}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">วันที่จัดงาน (ไม่บังคับ)</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 flex items-center gap-1"><FolderOpen size={12} />ลิงก์ Google Drive Folder</label>
          <input value={driveFolderUrl} onChange={e => setDriveFolderUrl(e.target.value)} required
            placeholder="https://drive.google.com/drive/folders/..."
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">รูปปก (ไม่บังคับ)</label>
          <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="text-sm text-slate-500" />
          {coverFile && <img src={URL.createObjectURL(coverFile)} alt="preview" className="w-full h-40 object-cover rounded-xl mt-1" />}
        </div>

        <button type="submit" disabled={loading}
          className="bg-amber-500 text-white rounded-xl py-2 font-medium hover:bg-amber-600 transition disabled:opacity-50">
          {loading ? 'กำลังสร้าง...' : 'สร้างอัลบั้ม'}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {albums.map(album => (
          <div key={album.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex">
            <div className="w-24 shrink-0 bg-amber-50 flex items-center justify-center">
              {album.coverUrl
                ? <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                : <FolderOpen size={28} className="text-amber-300" />}
            </div>
            <div className="flex-1 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{album.name}</p>
                {album.date && <p className="text-xs text-slate-400 mt-0.5">{format(album.date, 'dd MMM yyyy', { locale: th })}</p>}
                {album.description && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{album.description}</p>}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <a href={album.driveFolderUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-amber-500 hover:text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition">
                  เปิด Drive
                </a>
                <button onClick={() => handleDelete(album.id)} className="text-red-400 hover:text-red-600 transition">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {albums.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">ยังไม่มีอัลบั้ม</div>}
      </div>
    </div>
  )
}
