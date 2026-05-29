'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { uploadFileToSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { Trash2, Plus, ExternalLink, Upload, Link, X, Search, CheckCircle, AlertCircle, Eye, EyeOff, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

/* ── Toast ──────────────────────────────────────────── */
type ToastType = 'success' | 'error'
interface Toast { id: number; message: string; type: ToastType }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }, [])
  return { toasts, show }
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-slide-up
            ${t.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {t.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {t.message}
        </div>
      ))}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────── */
export default function AdminWorksPage() {
  const { toasts, show } = useToast()

  const [items, setItems] = useState<any[]>([])
  const [filterYear, setFilterYear] = useState('')
  const [search, setSearch] = useState('')

  const currentThaiYear = String(new Date().getFullYear() + 543)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [academicYear, setAcademicYear] = useState(currentThaiYear)
  const [status, setStatus] = useState<'เผยแพร่' | 'ร่าง'>('เผยแพร่')
  const [inputMode, setInputMode] = useState<'upload' | 'link'>('upload')
  const [files, setFiles] = useState<File[]>([])
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
    if (!isConfigured) { show('ต้องตั้งค่า Firebase ก่อน', 'error'); return }
    setLoading(true)
    try {
      let fileUrl = ''
      let fileUrls: string[] = []
      if (inputMode === 'upload' && files.length > 0) {
        fileUrls = await Promise.all(files.map(f => uploadFileToSupabase(f)))
        fileUrl = fileUrls[0]
      } else if (inputMode === 'link' && driveUrl) {
        const cleanUrl = driveUrl.split('?')[0].trim()
        if (!cleanUrl.startsWith('https://drive.google.com/') && !cleanUrl.startsWith('https://docs.google.com/')) {
          show('ลิงก์ต้องเป็น Google Drive หรือ Google Docs', 'error')
          setLoading(false)
          return
        }
        fileUrl = cleanUrl
      }
      await addDoc(collection(db, 'works'), {
        title, description, category, academicYear, status, fileUrl,
        fileUrls: fileUrls.length > 0 ? fileUrls : (fileUrl ? [fileUrl] : []),
        createdAt: serverTimestamp(),
      })
      setTitle(''); setDescription(''); setCategory(''); setFiles([]); setDriveUrl('')
      setStatus('เผยแพร่')
      fetchItems()
      show('เพิ่มงานสำเร็จแล้ว')
    } catch (err: any) { show(err.message, 'error') }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!isConfigured) return
    await deleteDoc(doc(db, 'works', id))
    fetchItems()
    show('ลบงานแล้ว')
  }

  async function toggleStatus(item: any) {
    if (!isConfigured) return
    const next = item.status === 'เผยแพร่' ? 'ร่าง' : 'เผยแพร่'
    await updateDoc(doc(db, 'works', item.id), { status: next })
    fetchItems()
    show(`เปลี่ยนเป็น "${next}" แล้ว`)
  }

  // ── Edit state ───────────────────────────────────────
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editAcademicYear, setEditAcademicYear] = useState('')
  const [editStatus, setEditStatus] = useState<'เผยแพร่' | 'ร่าง'>('เผยแพร่')
  const [editNewFiles, setEditNewFiles] = useState<File[]>([])
  const [editLoading, setEditLoading] = useState(false)

  function openEdit(item: any) {
    setEditingItem(item)
    setEditTitle(item.title || '')
    setEditDescription(item.description || '')
    setEditCategory(item.category || '')
    setEditAcademicYear(item.academicYear || '')
    setEditStatus(item.status ?? 'เผยแพร่')
    setEditNewFiles([])
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfigured || !editingItem) return
    setEditLoading(true)
    try {
      let existingUrls: string[] = editingItem.fileUrls?.length > 0
        ? editingItem.fileUrls
        : editingItem.fileUrl ? [editingItem.fileUrl] : []

      if (editNewFiles.length > 0) {
        const newUrls = await Promise.all(editNewFiles.map(f => uploadFileToSupabase(f)))
        existingUrls = [...existingUrls, ...newUrls]
      }

      await updateDoc(doc(db, 'works', editingItem.id), {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        academicYear: editAcademicYear,
        status: editStatus,
        fileUrl: existingUrls[0] || '',
        fileUrls: existingUrls,
      })
      setEditingItem(null)
      fetchItems()
      show('บันทึกการแก้ไขแล้ว')
    } catch (err: any) { show(err.message, 'error') }
    setEditLoading(false)
  }

  async function removeFileFromItem(item: any, urlToRemove: string) {
    if (!isConfigured) return
    const urls: string[] = (item.fileUrls?.length > 0 ? item.fileUrls : item.fileUrl ? [item.fileUrl] : [])
      .filter((u: string) => u !== urlToRemove)
    await updateDoc(doc(db, 'works', item.id), {
      fileUrl: urls[0] || '',
      fileUrls: urls,
    })
    setEditingItem((prev: any) => prev ? { ...prev, fileUrls: urls, fileUrl: urls[0] || '' } : null)
    fetchItems()
    show('ลบไฟล์แล้ว')
  }

  const years = [...new Set(items.map(m => m.academicYear).filter(Boolean))].sort().reverse() as string[]

  const filteredItems = items
    .filter(m => !filterYear || m.academicYear === filterYear)
    .filter(m => !search || m.title?.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.2s ease; }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">จัดการคลังงาน</h1>

        {!isConfigured && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
            Dev mode — ต้องตั้งค่า Firebase ก่อนจึงจะบันทึกได้
          </div>
        )}

        {!isSupabaseConfigured && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
            <strong>ยังไม่ได้ตั้งค่า Supabase</strong> — การอัปโหลดไฟล์จะไม่ทำงาน<br />
            กรุณาเพิ่ม <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> และ{' '}
            <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ใน Vercel Environment Variables
          </div>
        )}

        {/* Add Form */}
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 p-6 mb-8 flex flex-col gap-4">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm"><Plus size={16} />เพิ่มงานใหม่</h2>

          <div className="flex gap-3">
            <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} required placeholder="ปีการศึกษา เช่น 2568"
              className="w-44 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <select value={category} onChange={e => setCategory(e.target.value)} required
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">เลือกหมวดหมู่</option>
              <option value="กิจกรรมคณะ">กิจกรรมคณะ</option>
              <option value="กิจกรรมมหาลัย">กิจกรรมมหาลัย</option>
            </select>
          </div>

          <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="ชื่องาน"
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="รายละเอียด" rows={3}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

          {/* Status toggle */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
            {(['เผยแพร่', 'ร่าง'] as const).map(s => (
              <button key={s} type="button" onClick={() => setStatus(s)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 transition
                  ${status === s
                    ? s === 'เผยแพร่' ? 'bg-emerald-600 text-white' : 'bg-slate-500 text-white'
                    : 'text-slate-500 hover:bg-slate-50'}`}>
                {s === 'เผยแพร่' ? <Eye size={14} /> : <EyeOff size={14} />}{s}
              </button>
            ))}
          </div>

          {/* Upload mode toggle */}
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
              <label className="text-xs text-slate-500">ไฟล์ PDF, Word, PowerPoint ฯลฯ (เลือกได้หลายไฟล์)</label>
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" multiple
                onChange={e => setFiles(e.target.files ? Array.from(e.target.files) : [])}
                className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
              {files.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                      <span className="truncate">{f.name}</span>
                      <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="ml-2 text-blue-400 hover:text-red-500 shrink-0"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
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

        {/* Filter + Search */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">ทุกปีการศึกษา</option>
            {years.map(y => <option key={y} value={y}>ปีการศึกษา {y}</option>)}
          </select>

          <div className="flex items-center gap-2 flex-1 min-w-48 border border-slate-200 rounded-xl px-4 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-400">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหางาน..."
              className="flex-1 text-sm outline-none bg-transparent" />
            {search && <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500"><X size={12} /></button>}
          </div>

          <p className="text-sm text-slate-400">{filteredItems.length} รายการ</p>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${item.status === 'ร่าง' || !item.status
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                    {item.status ?? 'เผยแพร่'}
                  </span>
                </div>
                {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {item.academicYear && (
                    <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-1 rounded-full border border-blue-100">
                      ปี {item.academicYear}
                    </span>
                  )}
                  {item.category && <span className="text-xs bg-violet-100 text-violet-600 px-2 py-1 rounded-full">{item.category}</span>}
                  {item.createdAt && <span className="text-xs text-slate-400">{format(item.createdAt, 'dd MMM yyyy', { locale: th })}</span>}
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {(item.fileUrls?.length > 0 ? item.fileUrls : item.fileUrl ? [item.fileUrl] : []).map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                      <ExternalLink size={11} />{item.fileUrls?.length > 1 ? `ไฟล์ ${i + 1}` : 'เปิดไฟล์'}
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button onClick={() => toggleStatus(item)}
                  title={item.status === 'ร่าง' ? 'เปลี่ยนเป็นเผยแพร่' : 'เปลี่ยนเป็นร่าง'}
                  className="text-slate-400 hover:text-emerald-600 transition">
                  {item.status === 'ร่าง' ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-blue-600 transition">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 transition">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">แก้ไขงาน</h2>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleUpdate} className="p-6 flex flex-col gap-4">
                <div className="flex gap-3">
                  <input value={editAcademicYear} onChange={e => setEditAcademicYear(e.target.value)} required placeholder="ปีการศึกษา"
                    className="w-40 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value)} required
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">เลือกหมวดหมู่</option>
                    <option value="กิจกรรมคณะ">กิจกรรมคณะ</option>
                    <option value="กิจกรรมมหาลัย">กิจกรรมมหาลัย</option>
                  </select>
                </div>

                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required placeholder="ชื่องาน"
                  className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="รายละเอียด" rows={3}
                  className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

                {/* Status */}
                <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
                  {(['เผยแพร่', 'ร่าง'] as const).map(s => (
                    <button key={s} type="button" onClick={() => setEditStatus(s)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 transition
                        ${editStatus === s
                          ? s === 'เผยแพร่' ? 'bg-emerald-600 text-white' : 'bg-slate-500 text-white'
                          : 'text-slate-500 hover:bg-slate-50'}`}>
                      {s === 'เผยแพร่' ? <Eye size={14} /> : <EyeOff size={14} />}{s}
                    </button>
                  ))}
                </div>

                {/* Existing files */}
                {(() => {
                  const urls: string[] = editingItem.fileUrls?.length > 0
                    ? editingItem.fileUrls
                    : editingItem.fileUrl ? [editingItem.fileUrl] : []
                  if (urls.length === 0) return null
                  return (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-500 font-medium">ไฟล์ที่มีอยู่</label>
                      {urls.map((url, i) => {
                        const name = (() => {
                          if (url.includes('drive.google.com') || url.includes('docs.google.com')) return 'Google Drive'
                          try { return decodeURIComponent(url.split('/').pop() || `ไฟล์ ${i + 1}`) } catch { return `ไฟล์ ${i + 1}` }
                        })()
                        return (
                          <div key={i} className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                            <span className="truncate text-slate-600">{name}</span>
                            <button type="button" onClick={() => removeFileFromItem(editingItem, url)}
                              className="ml-2 text-slate-300 hover:text-red-500 shrink-0 transition">
                              <X size={12} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}

                {/* Add new files */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium">เพิ่มไฟล์ใหม่ (ไม่บังคับ)</label>
                  <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" multiple
                    onChange={e => setEditNewFiles(e.target.files ? Array.from(e.target.files) : [])}
                    className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
                  {editNewFiles.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      {editNewFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                          <span className="truncate">{f.name}</span>
                          <button type="button" onClick={() => setEditNewFiles(p => p.filter((_, idx) => idx !== i))}
                            className="ml-2 text-blue-400 hover:text-red-500 shrink-0"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditingItem(null)}
                    className="flex-1 border border-slate-200 text-slate-500 rounded-xl py-2 text-sm hover:bg-slate-50 transition">
                    ยกเลิก
                  </button>
                  <button type="submit" disabled={editLoading}
                    className="flex-1 bg-blue-700 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50">
                    {editLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </>
  )
}
