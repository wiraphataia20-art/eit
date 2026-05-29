'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { BookOpen, FileText, ExternalLink, Clock, X, Search, FileIcon, ChevronRight } from 'lucide-react'
import MemberHeader from '@/components/MemberHeader'

function isDriveUrl(url: string) {
  return url?.includes('drive.google.com') || url?.includes('docs.google.com')
}

function getDriveEmbedUrl(url: string) {
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (fileIdMatch) return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
  return url
}

function getFileName(url: string): string {
  if (isDriveUrl(url)) return 'Google Drive'
  try {
    const decoded = decodeURIComponent(url.split('/').pop() || '')
    return decoded || 'ไฟล์แนบ'
  } catch {
    return 'ไฟล์แนบ'
  }
}

function getFileExt(url: string): string {
  const name = getFileName(url)
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return ext
}

function FileExtBadge({ url }: { url: string }) {
  const ext = getFileExt(url)
  const colors: Record<string, string> = {
    pdf: 'bg-red-50 text-red-600 border-red-100',
    doc: 'bg-blue-50 text-blue-600 border-blue-100',
    docx: 'bg-blue-50 text-blue-600 border-blue-100',
    ppt: 'bg-orange-50 text-orange-600 border-orange-100',
    pptx: 'bg-orange-50 text-orange-600 border-orange-100',
    xls: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    xlsx: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  }
  const color = colors[ext] || 'bg-slate-50 text-slate-500 border-slate-200'
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${color}`}>
      {ext || 'file'}
    </span>
  )
}

export default function WorksPage() {
  const [works, setWorks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)
  const [selectedWork, setSelectedWork] = useState<any | null>(null)
  const [filterYear, setFilterYear] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')

  function openFile(url: string) {
    if (isDriveUrl(url)) {
      setViewerUrl(getDriveEmbedUrl(url))
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  useEffect(() => {
    if (!isConfigured) { setWorks([]); setLoading(false); return }
    const q = query(collection(db, 'works'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setWorks(snap.docs
        .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() }))
        .filter((w: any) => !w.status || w.status === 'เผยแพร่')
      )
      setLoading(false)
    })
    return unsub
  }, [])

  const years = [...new Set(works.map(w => w.academicYear).filter(Boolean))].sort().reverse() as string[]
  const categories = [...new Set(works.map(w => w.category).filter(Boolean))].sort() as string[]

  const filtered = works
    .filter(w => !filterYear || w.academicYear === filterYear)
    .filter(w => !filterCategory || w.category === filterCategory)
    .filter(w => !search || w.title?.toLowerCase().includes(search.toLowerCase()) || w.description?.toLowerCase().includes(search.toLowerCase()))

  function getFileList(work: any): string[] {
    return work.fileUrls?.length > 0 ? work.fileUrls : work.fileUrl ? [work.fileUrl] : []
  }

  function getDisplayName(work: any, index: number, url: string): string {
    if (work.fileNames?.[index]) return work.fileNames[index]
    if (isDriveUrl(url)) return 'Google Drive'
    return `ไฟล์ ${index + 1}`
  }

  return (
    <div>
      <MemberHeader />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">คลังงาน</h1>
            <p className="text-sm text-slate-500">ผลงานและโปรเจคของสโมสร</p>
          </div>
        </div>

        {/* Filter bar */}
        {!loading && works.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
              <option value="">ทุกรุ่น</option>
              {years.map(y => <option key={y} value={y}>ปีการศึกษา {y}</option>)}
            </select>

            {categories.length > 0 && (
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white">
                <option value="">ทุกหมวดหมู่</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            <div className="flex items-center gap-2 flex-1 min-w-48 border border-slate-200 rounded-xl px-4 py-2 bg-white focus-within:ring-2 focus-within:ring-violet-400">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหางาน..."
                className="flex-1 text-sm outline-none bg-transparent" />
              {search && <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500"><X size={12} /></button>}
            </div>

            {(filterYear || filterCategory || search) && (
              <button onClick={() => { setFilterYear(''); setFilterCategory(''); setSearch('') }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition">
                <X size={12} />ล้าง filter
              </button>
            )}
            <span className="text-sm text-slate-400 ml-auto">{filtered.length} รายการ</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>{works.length === 0 ? 'ยังไม่มีผลงานในขณะนี้' : 'ไม่พบผลงานที่ตรงกับเงื่อนไข'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(work => {
              const fileList = getFileList(work)
              return (
                <div key={work.id}
                  onClick={() => setSelectedWork(work)}
                  className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start gap-4 hover:shadow-lg hover:border-violet-100 transition-all duration-200 cursor-pointer group">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-slate-800 group-hover:text-violet-700 transition-colors">{work.title}</h2>
                    {work.description && (
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-2">{work.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {work.academicYear && (
                        <span className="text-xs bg-blue-50 text-blue-600 font-medium px-3 py-1 rounded-full border border-blue-100">
                          รุ่นปี {work.academicYear}
                        </span>
                      )}
                      {work.category && (
                        <span className="text-xs bg-violet-50 text-violet-600 font-medium px-3 py-1 rounded-full border border-violet-100">
                          {work.category}
                        </span>
                      )}
                      {work.createdAt && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={11} />{format(work.createdAt, 'dd MMM yyyy', { locale: th })}
                        </span>
                      )}
                      {fileList.length > 0 && (
                        <span className="text-xs text-slate-400">{fileList.length} ไฟล์</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-violet-400 transition-colors shrink-0 mt-1" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedWork && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-8"
          onClick={e => { if (e.target === e.currentTarget) setSelectedWork(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start gap-4 p-6 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
                <FileText size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-800 leading-snug">{selectedWork.title}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {selectedWork.academicYear && (
                    <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2.5 py-1 rounded-full border border-blue-100">
                      รุ่นปี {selectedWork.academicYear}
                    </span>
                  )}
                  {selectedWork.category && (
                    <span className="text-xs bg-violet-50 text-violet-600 font-medium px-2.5 py-1 rounded-full border border-violet-100">
                      {selectedWork.category}
                    </span>
                  )}
                  {selectedWork.createdAt && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={10} />{format(selectedWork.createdAt, 'dd MMM yyyy', { locale: th })}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedWork(null)}
                className="text-slate-400 hover:text-slate-600 transition shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {selectedWork.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">รายละเอียด</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedWork.description}</p>
                </div>
              )}

              {/* File list */}
              {(() => {
                const fileList = getFileList(selectedWork)
                if (fileList.length === 0) return null
                return (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                      ไฟล์แนบ ({fileList.length} ไฟล์)
                    </p>
                    <div className="flex flex-col gap-2">
                      {fileList.map((url, i) => (
                        <button key={i} onClick={() => openFile(url)}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50 transition-all group/file text-left w-full">
                          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover/file:bg-white">
                            <FileIcon size={16} className="text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {getDisplayName(selectedWork, i, url)}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {isDriveUrl(url) ? 'Google Drive' : 'คลิกเพื่อเปิดไฟล์'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <FileExtBadge url={url} />
                            <ExternalLink size={14} className="text-slate-300 group-hover/file:text-violet-500 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewerUrl && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
            <p className="text-sm font-medium text-slate-700 truncate">ดูเอกสาร</p>
            <button onClick={() => setViewerUrl(null)} className="text-slate-400 hover:text-slate-700 transition">
              <X size={20} />
            </button>
          </div>
          <iframe src={viewerUrl} className="flex-1 w-full border-0" allow="autoplay" />
        </div>
      )}
    </div>
  )
}
