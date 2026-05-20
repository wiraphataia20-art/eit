'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, isConfigured } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { GraduationCap, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!isConfigured) {
      if (email === 'admin@test.com' && password === 'admin1234') {
        document.cookie = 'session=admin; path=/; max-age=86400'
        router.push('/admin/dashboard')
      } else if (email === 'member@test.com' && password === 'member1234') {
        document.cookie = 'session=member; path=/; max-age=86400'
        router.push('/calendar')
      } else {
        setError('Dev mode — admin: admin@test.com / admin1234 · member: member@test.com / member1234')
      }
      setLoading(false)
      return
    }

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      const profileSnap = await getDoc(doc(db, 'profiles', user.uid))
      const role = profileSnap.data()?.role || 'member'
      document.cookie = `session=${role}; path=/; max-age=86400`
      router.push(role === 'admin' ? '/admin/dashboard' : '/calendar')
    } catch {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl mx-auto mb-4">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">เข้าสู่ระบบ</h1>
          <p className="text-slate-400 text-sm mt-1">สโมสรนักศึกษา</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-sm text-slate-300 mb-2 block font-medium">อีเมล</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="email@example.com"
                  className="w-full bg-white/10 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-2 block font-medium">รหัสผ่าน</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />{error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3 font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-lg">
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
