'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { ImageIcon, FolderOpen, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export default function GalleryPage() {
  const [albums, setAlbums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    const q = query(collection(db, 'albums'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setAlbums(snap.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate() })))
      setLoading(false)
    }, () => {
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ')
      setLoading(false)
    })
    return unsub
  }, [retryKey])

  const images: string[] = selectedAlbum?.images ?? []

  const prev = useCallback(() => {
    setLightboxIndex(i => i === null ? null : (i - 1 + images.length) % images.length)
  }, [images.length])

  const next = useCallback(() => {
    setLightboxIndex(i => i === null ? null : (i + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setLightboxIndex(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, prev, next])

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
          <ImageIcon size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">แกลเลอรี่</h1>
          <p className="text-sm text-slate-500">รูปภาพจากกิจกรรมต่างๆ</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-24 text-slate-400">
          <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="mb-4">{error}</p>
          <button onClick={() => { setError(null); setLoading(true); setRetryKey(k => k + 1) }}
            className="text-sm text-amber-500 hover:underline">ลองใหม่</button>
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีอัลบั้ม</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map(album => {
            const imgs: string[] = album.images ?? []
            return (
              <button key={album.id} onClick={() => setSelectedAlbum(album)}
                className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden hover:shadow-lg transition-shadow duration-300 group text-left w-full">
                <div className="h-48 bg-gradient-to-br from-amber-50 to-orange-100 overflow-hidden flex items-center justify-center relative">
                  {album.coverUrl ? (
                    <img src={album.coverUrl} alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <FolderOpen size={48} className="text-amber-300" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center">
                    <ImageIcon size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  {imgs.length > 0 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      {imgs.length} รูป
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 transition">{album.name}</p>
                  {album.date && (
                    <p className="text-xs text-slate-400 mt-1">{format(album.date, 'dd MMMM yyyy', { locale: th })}</p>
                  )}
                  {album.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{album.description}</p>
                  )}
                  <p className="text-xs text-amber-500 mt-3">
                    {imgs.length > 0 ? `ดู ${imgs.length} รูปภาพ` : 'ดูอัลบั้ม'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Album modal */}
      {selectedAlbum && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-start justify-center px-4 py-8 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setSelectedAlbum(null) }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedAlbum.name}</h2>
                {selectedAlbum.date && (
                  <p className="text-sm text-slate-400 mt-0.5">{format(selectedAlbum.date, 'dd MMMM yyyy', { locale: th })}</p>
                )}
                {selectedAlbum.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedAlbum.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {selectedAlbum.driveFolderUrl && (
                  <a href={selectedAlbum.driveFolderUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl hover:bg-amber-50 transition">
                    <ExternalLink size={12} />Google Drive
                  </a>
                )}
                <button onClick={() => setSelectedAlbum(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Image grid */}
            <div className="p-6">
              {images.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <ImageIcon size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">ยังไม่มีรูปภาพในอัลบั้มนี้</p>
                  {selectedAlbum.driveFolderUrl && (
                    <a href={selectedAlbum.driveFolderUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-amber-500 hover:underline mt-3">
                      <ExternalLink size={13} />ดูรูปทั้งหมดใน Google Drive
                    </a>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((url, i) => (
                    <button key={i} onClick={() => setLightboxIndex(i)}
                      className="aspect-square overflow-hidden rounded-xl group relative">
                      <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-xl" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && images.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}>
          {/* Close */}
          <button onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition p-2 z-10">
            <X size={24} />
          </button>

          {/* Counter */}
          <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {images.length}
          </span>

          {/* Prev */}
          {images.length > 1 && (
            <button onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-4 text-white/70 hover:text-white transition p-3 rounded-full hover:bg-white/10 z-10">
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Image */}
          <img
            src={images[lightboxIndex]}
            alt=""
            onClick={e => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl select-none"
          />

          {/* Next */}
          {images.length > 1 && (
            <button onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-4 text-white/70 hover:text-white transition p-3 rounded-full hover:bg-white/10 z-10">
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
