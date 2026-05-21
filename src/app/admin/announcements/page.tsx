'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { uploadFileToSupabase } from '@/lib/supabase'
import { Trash2, Plus, Clock, Pin, PinOff, Pencil, X, CheckCircle, AlertCircle, ImageIcon, Paperclip } from 'lucide-react'
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
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-slide-up ${t.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {t.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {t.message}
        </div>
      ))}
    </div>
  )
}

/* ── Constants ──────────────────────────────────────── */
const ANNOUNCEMENT_TYPES = ['ข่าวทั่วไป', 'กิจกรรม', 'ทุนการศึกษา', 'ประชาสัมพันธ์']
const TYPE_STYLE: Record<string, string> = {
  'กิจกรรม':       'bg-blue-50 text-blue-600 border-blue-100',
  'ทุนการศึกษา':   'bg-emerald-50 text-emerald-600 border-emerald-100',
  'ประชาสัมพันธ์': 'bg-violet-50 text-violet-600 border-violet-100',
  'ข่าวทั่วไป':    'bg-slate-50 text-slate-500 border-slate-200',
}

/* ── File tag helper ─────────────────────────────────── */
function FileTag({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
      <span className="truncate text-slate-600">{name}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-2 text-slate-300 hover:text-red-500 shrink-0 transition">
          <X size={12} />
        </button>
      )}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────── */
export default function AdminAnnouncementsPage() {
  const { toasts, show } = useToast()
  const [items, setItems] = useState<any[]>([])

  /* add form */
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [announcementType, setAnnouncementType] = useState('ข่าวทั่วไป')
  const [eventDate, setEventDate] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [contentImageFiles, setContentImageFiles] = useState<File[]>([])
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [isPinned, setIsPinned] = useState(false)
  const [publishDate, setPublishDate] = useState('')
  const [publishTime, setPublishTime] = useState('08:00')
  const [loading, setLoading] = useState(false)

  /* edit form */
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editType, setEditType] = useState('ข่าวทั่วไป')
  const [editEventDate, setEditEventDate] = useState('')
  const [editIsPinned, setEditIsPinned] = useState(false)
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null)
  const [editNewImages, setEditNewImages] = useState<File[]>([])
  const [editNewAttachments, setEditNewAttachments] = useState<File[]>([])
  const [editLoading, setEditLoading] = useState(false)

  async function fetchItems() {
    if (!isConfigured) return
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate(), eventDate: d.data().eventDate?.toDate() })))
  }

  useEffect(() => { fetchItems() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfigured) { show('ต้องตั้งค่า Firebase ก่อน', 'error'); return }
    setLoading(true)
    try {
      let imageUrl = ''
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile)
      const contentImages = contentImageFiles.length > 0
        ? await Promise.all(contentImageFiles.map(f => uploadToCloudinary(f)))
        : []
      const attachments = attachmentFiles.length > 0
        ? await Promise.all(attachmentFiles.map(async f => ({ name: f.name, url: await uploadFileToSupabase(f) })))
        : []

      await addDoc(collection(db, 'announcements'), {
        title, content, imageUrl, announcementType, contentImages, attachments,
        eventDate: eventDate ? new Date(eventDate) : null,
        isPinned,
        publishAt: isPinned && publishDate ? new Date(`${publishDate}T${publishTime || '00:00'}`) : isPinned ? new Date() : null,
        createdAt: serverTimestamp(),
      })
      setTitle(''); setContent(''); setEventDate(''); setImageFile(null)
      setContentImageFiles([]); setAttachmentFiles([])
      setIsPinned(false); setPublishDate(''); setPublishTime('08:00')
      setAnnouncementType('ข่าวทั่วไป')
      fetchItems()
      show('เพิ่มประกาศสำเร็จแล้ว')
    } catch (err: any) { show(err.message, 'error') }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!isConfigured) return
    await deleteDoc(doc(db, 'announcements', id))
    fetchItems()
    show('ลบประกาศแล้ว')
  }

  async function handleTogglePin(id: string, current: boolean) {
    if (!isConfigured) return
    await updateDoc(doc(db, 'announcements', id), { isPinned: !current, publishAt: !current ? new Date() : null })
    fetchItems()
    show(!current ? 'ตั้งเป็นประกาศสำคัญแล้ว' : 'ยกเลิกประกาศสำคัญแล้ว')
  }

  function openEdit(item: any) {
    setEditingItem(item)
    setEditTitle(item.title || '')
    setEditContent(item.content || '')
    setEditType(item.announcementType || 'ข่าวทั่วไป')
    setEditEventDate(item.eventDate ? format(item.eventDate, 'yyyy-MM-dd') : '')
    setEditIsPinned(item.isPinned || false)
    setEditCoverFile(null); setEditNewImages([]); setEditNewAttachments([])
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfigured || !editingItem) return
    setEditLoading(true)
    try {
      let imageUrl = editingItem.imageUrl || ''
      if (editCoverFile) imageUrl = await uploadToCloudinary(editCoverFile)

      const existingImages: string[] = editingItem.contentImages || []
      const newImages = editNewImages.length > 0 ? await Promise.all(editNewImages.map(f => uploadToCloudinary(f))) : []

      const existingAttachments: any[] = editingItem.attachments || []
      const newAttachments = editNewAttachments.length > 0
        ? await Promise.all(editNewAttachments.map(async f => ({ name: f.name, url: await uploadFileToSupabase(f) })))
        : []

      await updateDoc(doc(db, 'announcements', editingItem.id), {
        title: editTitle, content: editContent, announcementType: editType,
        eventDate: editEventDate ? new Date(editEventDate) : null,
        isPinned: editIsPinned, imageUrl,
        contentImages: [...existingImages, ...newImages],
        attachments: [...existingAttachments, ...newAttachments],
      })
      setEditingItem(null)
      fetchItems()
      show('บันทึกการแก้ไขแล้ว')
    } catch (err: any) { show(err.message, 'error') }
    setEditLoading(false)
  }

  async function removeContentImage(item: any, idx: number) {
    const updated = (item.contentImages || []).filter((_: any, i: number) => i !== idx)
    await updateDoc(doc(db, 'announcements', item.id), { contentImages: updated })
    setEditingItem((p: any) => p ? { ...p, contentImages: updated } : null)
    fetchItems()
  }

  async function removeAttachment(item: any, idx: number) {
    const updated = (item.attachments || []).filter((_: any, i: number) => i !== idx)
    await updateDoc(doc(db, 'announcements', item.id), { attachments: updated })
    setEditingItem((p: any) => p ? { ...p, attachments: updated } : null)
    fetchItems()
  }

  function isExpired(item: any) {
    if (!item.eventDate) return false
    const expiry = new Date(item.eventDate)
    expiry.setDate(expiry.getDate() + 3)
    return new Date() > expiry
  }

  return (
    <>
      <style>{`
        @keyframes slide-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .animate-slide-up { animation: slide-up 0.2s ease; }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">จัดการประกาศ</h1>

        {!isConfigured && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
            Dev mode — ต้องตั้งค่า Firebase ก่อนจึงจะบันทึกได้
          </div>
        )}

        {/* Add Form */}
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 p-6 mb-8 flex flex-col gap-4">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm"><Plus size={16} />เพิ่มประกาศใหม่</h2>

          <div className="flex gap-3">
            <select value={announcementType} onChange={e => setAnnouncementType(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              {ANNOUNCEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="หัวข้อ"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <textarea value={content} onChange={e => setContent(e.target.value)} required placeholder="เนื้อหา" rows={4}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} />วันที่กิจกรรม (ประกาศจะหายอัตโนมัติหลังจากนี้ 3 วัน)</label>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {/* Cover image */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-medium">รูปปก (thumbnail)</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)}
              className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
          </div>

          {/* Content images */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-medium flex items-center gap-1"><ImageIcon size={12} />รูปภาพในรายละเอียด (เลือกได้หลายรูป)</label>
            <input type="file" accept="image/*" multiple
              onChange={e => setContentImageFiles(e.target.files ? Array.from(e.target.files) : [])}
              className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
            {contentImageFiles.length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                {contentImageFiles.map((f, i) => (
                  <FileTag key={i} name={f.name} onRemove={() => setContentImageFiles(p => p.filter((_, idx) => idx !== i))} />
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-medium flex items-center gap-1"><Paperclip size={12} />ไฟล์แนบ PDF (เลือกได้หลายไฟล์)</label>
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" multiple
              onChange={e => setAttachmentFiles(e.target.files ? Array.from(e.target.files) : [])}
              className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
            {attachmentFiles.length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                {attachmentFiles.map((f, i) => (
                  <FileTag key={i} name={f.name} onRemove={() => setAttachmentFiles(p => p.filter((_, idx) => idx !== i))} />
                ))}
              </div>
            )}
          </div>

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

        {/* List */}
        <div className="flex flex-col gap-4">
          {items.map(item => {
            const typeStyle = TYPE_STYLE[item.announcementType] || TYPE_STYLE['ข่าวทั่วไป']
            return (
              <div key={item.id} className={`bg-white rounded-2xl border p-5 flex justify-between items-start ${isExpired(item) ? 'border-red-100 opacity-60' : item.isPinned ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-slate-800">{item.title}</p>
                    {item.announcementType && <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeStyle}`}>{item.announcementType}</span>}
                    {item.isPinned && <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1"><Pin size={9} />ประกาศสำคัญ</span>}
                    {isExpired(item) && <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">หมดอายุแล้ว</span>}
                    {item.contentImages?.length > 0 && <span className="text-xs text-slate-400 flex items-center gap-1"><ImageIcon size={10} />{item.contentImages.length} รูป</span>}
                    {item.attachments?.length > 0 && <span className="text-xs text-slate-400 flex items-center gap-1"><Paperclip size={10} />{item.attachments.length} ไฟล์</span>}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">{item.content}</p>
                  {item.eventDate && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Clock size={11} />วันกิจกรรม: {format(item.eventDate, 'dd MMM yyyy', { locale: th })}</p>}
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button onClick={() => handleTogglePin(item.id, item.isPinned)}
                    className={`p-1.5 rounded-xl transition ${item.isPinned ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-100' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`}>
                    {item.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                  </button>
                  <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-blue-600 transition"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={18} /></button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">แก้ไขประกาศ</h2>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 transition"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleUpdate} className="p-6 flex flex-col gap-4">
                <div className="flex gap-3">
                  <select value={editType} onChange={e => setEditType(e.target.value)}
                    className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {ANNOUNCEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required placeholder="หัวข้อ"
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} required placeholder="เนื้อหา" rows={4}
                  className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} />วันที่กิจกรรม</label>
                  <input type="date" value={editEventDate} onChange={e => setEditEventDate(e.target.value)}
                    className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                {/* Cover */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium">เปลี่ยนรูปปก (ไม่บังคับ)</label>
                  <input type="file" accept="image/*" onChange={e => setEditCoverFile(e.target.files?.[0] || null)}
                    className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
                </div>

                {/* Existing content images */}
                {editingItem.contentImages?.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-medium flex items-center gap-1"><ImageIcon size={12} />รูปภาพในรายละเอียด</label>
                    <div className="grid grid-cols-3 gap-2">
                      {editingItem.contentImages.map((url: string, i: number) => (
                        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-100">
                          <img src={url} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeContentImage(editingItem, i)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium flex items-center gap-1"><ImageIcon size={12} />เพิ่มรูปภาพในรายละเอียด</label>
                  <input type="file" accept="image/*" multiple onChange={e => setEditNewImages(e.target.files ? Array.from(e.target.files) : [])}
                    className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
                  {editNewImages.map((f, i) => <FileTag key={i} name={f.name} onRemove={() => setEditNewImages(p => p.filter((_, idx) => idx !== i))} />)}
                </div>

                {/* Existing attachments */}
                {editingItem.attachments?.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-medium flex items-center gap-1"><Paperclip size={12} />ไฟล์แนบที่มีอยู่</label>
                    {editingItem.attachments.map((a: any, i: number) => (
                      <FileTag key={i} name={a.name || `ไฟล์ ${i + 1}`} onRemove={() => removeAttachment(editingItem, i)} />
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium flex items-center gap-1"><Paperclip size={12} />เพิ่มไฟล์แนบ</label>
                  <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" multiple
                    onChange={e => setEditNewAttachments(e.target.files ? Array.from(e.target.files) : [])}
                    className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
                  {editNewAttachments.map((f, i) => <FileTag key={i} name={f.name} onRemove={() => setEditNewAttachments(p => p.filter((_, idx) => idx !== i))} />)}
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={editIsPinned} onChange={e => setEditIsPinned(e.target.checked)} className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm font-medium text-amber-700 flex items-center gap-1"><Pin size={13} />ประกาศสำคัญ</span>
                </label>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditingItem(null)}
                    className="flex-1 border border-slate-200 text-slate-500 rounded-xl py-2 text-sm hover:bg-slate-50 transition">ยกเลิก</button>
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
