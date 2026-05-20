'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { BookOpen, FileText, ExternalLink, Clock, X } from 'lucide-react'
import MemberHeader from '@/components/MemberHeader'

function isDriveUrl(url: string) {
  return url?.includes('drive.google.com') || url?.includes('docs.google.com')
}

function getDriveEmbedUrl(url: string) {
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (fileIdMatch) return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
  return url
}

export default function WorksPage() {
  const [works, setWorks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)

  function openFile(url: string) {
    if (isDriveUrl(url)) {
      setViewerUrl(getDriveEmbedUrl(url))
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  useEffect(() => {
    async function fetch() {
      if (!isConfigured) { setWorks([]); setLoading(false); return }
      const q = query(collection(db, 'works'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setWorks(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() })))
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div>
      <MemberHeader />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">คลังงาน</h1>
            <p className="text-sm text-slate-500">ผลงานและโปรเจคของสโมสร</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" /></div>
        ) : works.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีผลงานในขณะนี้</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {works.map(work => (
              <div key={work.id} className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start gap-4 hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
                  <FileText size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-slate-800">{work.title}</h2>
                  {work.description && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{work.description}</p>}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {work.category && (
                      <span className="text-xs bg-violet-50 text-violet-600 font-medium px-3 py-1 rounded-full border border-violet-100">{work.category}</span>
                    )}
                    {work.createdAt && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={11} />{format(work.createdAt, 'dd MMM yyyy', { locale: th })}
                      </span>
                    )}
                  </div>
                </div>
                {work.fileUrl && (
                  <button onClick={() => openFile(work.fileUrl)}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition">
                    <ExternalLink size={13} />เปิดไฟล์
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {viewerUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">
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
