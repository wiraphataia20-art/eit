'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { Trash2, Plus, FolderOpen, X, ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export default function AdminGalleryPage() {
  const [albums, setAlbums] = useState<any[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [driveFolderUrl, setDriveFolderUrl] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [addFilesMap, setAddFilesMap] = useState<Record<string, File[]>>({})
  const [driveLinks, setDriveLinks] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!coverFile) { setCoverPreviewUrl(null); return }
    const url = URL.createObjectURL(coverFile)
    setCoverPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [coverFile])

  function parseDriveLinks(text: string): string[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    return lines.flatMap(line => {
      const m = line.match(/\/d\/([a-zA-Z0-9_-]+)/) ?? line.match(/[?&]id=([a-zA-Z0-9_-]+)/)
      if (!m) return []
      return [`https://lh3.googleusercontent.com/d/${m[1]}`]
    })
  }

  async function handleAddDriveLinks(album: any) {
    if (!isConfigured) return
    const newUrls = parseDriveLinks(driveLinks[album.id] ?? '')
    if (newUrls.length === 0) { alert('ไม่พบลิงก์ Drive ที่ถูกต้อง'); return }
    const merged = [...(album.images ?? []), ...newUrls]
    await updateDoc(doc(db, 'albums', album.id), { images: merged })
    setDriveLinks(p => ({ ...p, [album.id]: '' }))
    fetchAlbums()
  }

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
    if (cleanUrl && !cleanUrl.startsWith('https://drive.google.com/')) {
      alert('ลิงก์ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://drive.google.com/')
      return
    }
    setLoading(true)
    try {
      let coverUrl = ''
      if (coverFile) coverUrl = await uploadToCloudinary(coverFile)
      const images: string[] = await Promise.all(imageFiles.map(f => uploadToCloudinary(f)))
      await addDoc(collection(db, 'albums'), {
        name, description, driveFolderUrl: cleanUrl, coverUrl,
        images,
        date: date ? new Date(date) : null,
        createdAt: serverTimestamp(),
      })
      setName(''); setDescription(''); setDate(''); setDriveFolderUrl('')
      setCoverFile(null); setImageFiles([])
      fetchAlbums()

    } catch (err: any) { alert(err.message) }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!isConfigured) return
    await deleteDoc(doc(db, 'albums', id))
    fetchAlbums()
  }

  async function handleAddImages(album: any) {
    const files = addFilesMap[album.id] ?? []
    if (!isConfigured || files.length === 0) return
    setUploadingFor(album.id)
    try {
      const newUrls: string[] = await Promise.all(files.map(f => uploadToCloudinary(f)))
      const merged = [...(album.images ?? []), ...newUrls]
      await updateDoc(doc(db, 'albums', album.id), { images: merged })
      setAddFilesMap(p => ({ ...p, [album.id]: [] }))
      setUploadingFor(null)
      fetchAlbums()
    } catch (err: any) { alert(err.message); setUploadingFor(null) }
  }

  async function removeImage(album: any, url: string) {
    if (!isConfigured) return
    const images = (album.images ?? []).filter((u: string) => u !== url)
    await updateDoc(doc(db, 'albums', album.id), { images })
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
          <label className="text-xs text-slate-500 flex items-center gap-1"><FolderOpen size={12} />ลิงก์ Google Drive Folder (ไม่บังคับ)</label>
          <input value={driveFolderUrl} onChange={e => setDriveFolderUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">รูปปก (ไม่บังคับ)</label>
          <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="text-sm text-slate-500" />
          {coverPreviewUrl && <img src={coverPreviewUrl} alt="preview" className="w-full h-40 object-cover rounded-xl mt-1" />}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-500 flex items-center gap-1"><ImageIcon size={12} />รูปภาพในอัลบั้ม (เลือกได้หลายรูป)</label>
          <input type="file" accept="image/*" multiple
            onChange={e => setImageFiles(e.target.files ? Array.from(e.target.files) : [])}
            className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
          {imageFiles.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-1">
              {imageFiles.map((f, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button type="button" onClick={() => setImageFiles(p => p.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="bg-amber-500 text-white rounded-xl py-2 font-medium hover:bg-amber-600 transition disabled:opacity-50">
          {loading ? 'กำลังอัปโหลด...' : 'สร้างอัลบั้ม'}
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {albums.map(album => (
          <div key={album.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex">
              <div className="w-24 h-24 shrink-0 bg-amber-50 flex items-center justify-center">
                {album.coverUrl
                  ? <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                  : <FolderOpen size={28} className="text-amber-300" />}
              </div>
              <div className="flex-1 p-4 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{album.name}</p>
                  {album.date && <p className="text-xs text-slate-400 mt-0.5">{format(album.date, 'dd MMM yyyy', { locale: th })}</p>}
                  {album.description && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{album.description}</p>}
                  <p className="text-xs text-slate-400 mt-1">{(album.images ?? []).length} รูปภาพ</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {album.driveFolderUrl && (
                    <a href={album.driveFolderUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-amber-500 hover:text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition">
                      Drive
                    </a>
                  )}
                  <button onClick={() => handleDelete(album.id)} className="text-red-400 hover:text-red-600 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Image grid + add more */}
            <div className="px-4 pb-4 flex flex-col gap-3">
              {(album.images ?? []).length > 0 && (
                <div className="grid grid-cols-6 gap-1.5">
                  {(album.images as string[]).map((url, i) => (
                    <div key={i} className="relative aspect-square group">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                      <button onClick={() => removeImage(album, url)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add images — upload file */}
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                <p className="text-xs font-medium text-slate-500">เพิ่มรูปภาพ</p>

                {/* Option A: upload */}
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" multiple
                    onChange={e => setAddFilesMap(p => ({ ...p, [album.id]: e.target.files ? Array.from(e.target.files) : [] }))}
                    className="flex-1 text-xs text-slate-500 border border-slate-200 rounded-xl px-3 py-1.5" />
                  <button onClick={() => handleAddImages(album)}
                    disabled={uploadingFor === album.id || (addFilesMap[album.id] ?? []).length === 0}
                    className="shrink-0 bg-amber-500 text-white text-xs px-3 py-1.5 rounded-xl hover:bg-amber-600 transition disabled:opacity-40">
                    {uploadingFor === album.id ? 'กำลังอัปโหลด...' : `อัปโหลด${(addFilesMap[album.id] ?? []).length > 0 ? ` (${(addFilesMap[album.id] ?? []).length})` : ''}`}
                  </button>
                </div>

                {/* Option B: paste Drive links */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">หรือวาง Google Drive link (ทีละบรรทัด)</label>
                  <div className="flex gap-2">
                    <textarea
                      value={driveLinks[album.id] ?? ''}
                      onChange={e => setDriveLinks(p => ({ ...p, [album.id]: e.target.value }))}
                      placeholder={'https://drive.google.com/file/d/xxx/view\nhttps://drive.google.com/file/d/yyy/view'}
                      rows={3}
                      className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    <button onClick={() => handleAddDriveLinks(album)}
                      disabled={!(driveLinks[album.id] ?? '').trim()}
                      className="shrink-0 self-end bg-blue-500 text-white text-xs px-3 py-1.5 rounded-xl hover:bg-blue-600 transition disabled:opacity-40">
                      เพิ่ม
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {albums.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">ยังไม่มีอัลบั้ม</div>}
      </div>
    </div>
  )
}
