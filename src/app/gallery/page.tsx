'use client'

import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { ImageIcon, FolderOpen, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export default function GalleryPage() {
  const [albums, setAlbums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    const q = query(collection(db, 'albums'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setAlbums(snap.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate() })))
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
          <ImageIcon size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">แกลเลอรี่</h1>
          <p className="text-sm text-slate-500">รูปภาพจากกิจกรรมต่างๆ</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" /></div>
      ) : albums.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีอัลบั้ม</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map(album => (
            <a key={album.id} href={album.driveFolderUrl} target="_blank" rel="noopener noreferrer"
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
              <div className="h-48 bg-gradient-to-br from-amber-50 to-orange-100 overflow-hidden flex items-center justify-center relative">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <FolderOpen size={48} className="text-amber-300" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <ExternalLink size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
              <div className="p-4">
                <p className="font-bold text-slate-800 group-hover:text-amber-600 transition">{album.name}</p>
                {album.date && (
                  <p className="text-xs text-slate-400 mt-1">{format(album.date, 'dd MMMM yyyy', { locale: th })}</p>
                )}
                {album.description && (
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">{album.description}</p>
                )}
                <p className="text-xs text-amber-500 mt-3 flex items-center gap-1">
                  <ExternalLink size={11} />ดูรูปทั้งหมดใน Google Drive
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
