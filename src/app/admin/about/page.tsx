'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { Info } from 'lucide-react'

function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; ok: boolean }[]>([])
  function show(msg: string, ok = true) {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, ok }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }
  return { toasts, show }
}

function ToastContainer({ toasts }: { toasts: { id: number; msg: string; ok: boolean }[] }) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${t.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {t.ok ? '✓' : '✕'} {t.msg}
        </div>
      ))}
    </div>
  )
}

export default function AdminAboutPage() {
  const { toasts, show } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [history, setHistory] = useState('')
  const [vision, setVision] = useState('')
  const [mission, setMission] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactLine, setContactLine] = useState('')
  const [contactFacebook, setContactFacebook] = useState('')
  const [contactInstagram, setContactInstagram] = useState('')

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    getDoc(doc(db, 'config', 'about')).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setHistory(d.history || '')
        setVision(d.vision || '')
        setMission(d.mission || '')
        setContactPhone(d.contactPhone || '')
        setContactEmail(d.contactEmail || '')
        setContactLine(d.contactLine || '')
        setContactFacebook(d.contactFacebook || '')
        setContactInstagram(d.contactInstagram || '')
      }
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfigured) { show('ต้องตั้งค่า Firebase ก่อน', false); return }
    setSaving(true)
    try {
      await setDoc(doc(db, 'config', 'about'), {
        history, vision, mission,
        contactPhone, contactEmail, contactLine,
        contactFacebook, contactInstagram,
        updatedAt: new Date(),
      })
      show('บันทึกสำเร็จ')
    } catch (err: any) { show(err.message, false) }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <ToastContainer toasts={toasts} />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7B1113] to-[#9B1416] flex items-center justify-center shadow-sm">
          <Info size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">เกี่ยวกับสโมสร</h1>
          <p className="text-xs text-slate-400 mt-0.5">แก้ไขข้อมูลที่แสดงในหน้า "เกี่ยวกับ"</p>
        </div>
      </div>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
          Dev mode — ต้องตั้งค่า Firebase ก่อนจึงจะบันทึกได้
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* History */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3">
          <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
            <span className="w-1 h-4 bg-[#7B1113] rounded-full inline-block" />
            ประวัติสโมสร
          </h2>
          <textarea value={history} onChange={e => setHistory(e.target.value)} rows={5}
            placeholder="เขียนประวัติความเป็นมาของสโมสร..."
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        </div>

        {/* Vision & Mission */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3">
          <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full inline-block" />
            วิสัยทัศน์ / พันธกิจ
          </h2>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">วิสัยทัศน์</label>
            <textarea value={vision} onChange={e => setVision(e.target.value)} rows={3}
              placeholder="วิสัยทัศน์ของสโมสร..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">พันธกิจ</label>
            <textarea value={mission} onChange={e => setMission(e.target.value)} rows={3}
              placeholder="พันธกิจของสโมสร..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3">
          <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
            <span className="w-1 h-4 bg-violet-500 rounded-full inline-block" />
            ข้อมูลติดต่อ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'โทรศัพท์', value: contactPhone, set: setContactPhone, placeholder: '0xx-xxx-xxxx' },
              { label: 'อีเมล', value: contactEmail, set: setContactEmail, placeholder: 'email@example.com' },
              { label: 'Line ID', value: contactLine, set: setContactLine, placeholder: 'Line ID' },
              { label: 'Facebook', value: contactFacebook, set: setContactFacebook, placeholder: 'facebook.com/...' },
              { label: 'Instagram', value: contactInstagram, set: setContactInstagram, placeholder: '@handle' },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="bg-blue-700 text-white rounded-xl py-2.5 font-medium hover:bg-blue-800 transition disabled:opacity-50 text-sm">
          {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </form>
    </div>
  )
}
