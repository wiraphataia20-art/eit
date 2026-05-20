'use client'

import { useEffect, useRef, useState } from 'react'

const VIDEOS = ['/video1.mp4', '/video2.mp4', '/video3.mp4', '/video4.mp4', '/video5.mp4', '/video6.mp4']
const FADE = 1200 // ms crossfade duration

export default function HeroVideo() {
  const refA = useRef<HTMLVideoElement>(null)
  const refB = useRef<HTMLVideoElement>(null)
  const isAActive = useRef(true)
  const indexRef = useRef(0)
  const [opacityA, setOpacityA] = useState(1)
  const [opacityB, setOpacityB] = useState(0)

  useEffect(() => {
    const a = refA.current
    const b = refB.current
    if (!a || !b) return

    // Initial load
    a.src = VIDEOS[0]
    b.src = VIDEOS[1]
    a.load(); b.load()
    a.play().catch(() => {})

    function loadNext() {
      const nextIdx = (indexRef.current + 1) % VIDEOS.length
      const afterNext = (indexRef.current + 2) % VIDEOS.length
      const inactive = isAActive.current ? refB.current : refA.current
      const active   = isAActive.current ? refA.current : refB.current
      if (!inactive || !active) return

      // Next video already preloaded in inactive → just play
      inactive.currentTime = 0
      inactive.play().catch(() => {})

      // Crossfade
      if (isAActive.current) { setOpacityA(0); setOpacityB(1) }
      else                    { setOpacityA(1); setOpacityB(0) }

      // Preload the one after next into now-active (soon inactive)
      setTimeout(() => {
        if (!active) return
        active.src = VIDEOS[afterNext]
        active.load()
      }, 600)

      isAActive.current = !isAActive.current
      indexRef.current  = nextIdx
    }

    a.addEventListener('ended', loadNext)
    b.addEventListener('ended', loadNext)
    return () => {
      a.removeEventListener('ended', loadNext)
      b.removeEventListener('ended', loadNext)
    }
  }, [])

  const base = 'absolute inset-0 w-full h-full object-cover'
  const transition = `opacity ${FADE}ms ease-in-out`

  return (
    <>
      <video ref={refA} className={base} style={{ opacity: opacityA, transition }} muted playsInline preload="auto" />
      <video ref={refB} className={base} style={{ opacity: opacityB, transition }} muted playsInline preload="auto" />
      {/* Overlay for text readability */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(123,17,19,0.65) 0%, rgba(13,6,8,0.72) 100%)' }} />
    </>
  )
}
