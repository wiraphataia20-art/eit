'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth, isConfigured } from '@/lib/firebase'
import { UserCircle, Shield, User, Trash2, Plus } from 'lucide-react'

const DEV_MEMBERS = [
  { id: '1', email: 'admin@test.com', role: 'admin' },
  { id: '2', email: 'member@test.com', role: 'member' },
]

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('member')
  const [loading, setLoading] = useState(false)

  async function fetchMembers() {
    if (!isConfigured) { setMembers(DEV_MEMBERS); return }
    const snap = await getDocs(collection(db, 'profiles'))
    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { fetchMembers() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfigured) { alert('ต้องตั้งค่า Firebase ก่อน'); return }
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, newEmail, newPassword)
      await setDoc(doc(db, 'profiles', user.uid), { email: newEmail, role: newRole, createdAt: serverTimestamp() })
      setNewEmail(''); setNewPassword('')
      fetchMembers()
    } catch (err: any) {
      alert(err.message)
    }
    setLoading(false)
  }

  async function handleRoleChange(id: string, role: string) {
    if (!isConfigured) return
    await updateDoc(doc(db, 'profiles', id), { role })
    fetchMembers()
  }

  async function handleDelete(id: string) {
    if (!isConfigured) return
    await deleteDoc(doc(db, 'profiles', id))
    fetchMembers()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
          <UserCircle size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">จัดการสมาชิก</h1>
          <p className="text-sm text-slate-500">กำหนด role admin / member</p>
        </div>
      </div>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
          Dev mode — การเปลี่ยนแปลงจะไม่ถูกบันทึก
        </div>
      )}

      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 flex flex-col gap-4">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2 text-sm"><Plus size={16} />เพิ่มสมาชิกใหม่</h2>
        <div className="flex gap-3">
          <input value={newEmail} onChange={e => setNewEmail(e.target.value)} required placeholder="อีเมล"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="รหัสผ่าน" type="password"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div className="flex gap-3">
          <select value={newRole} onChange={e => setNewRole(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" disabled={loading}
            className="flex-1 bg-blue-700 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'กำลังสร้าง...' : 'สร้างบัญชี'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <p className="text-sm font-semibold text-slate-700">สมาชิกทั้งหมด ({members.length} คน)</p>
        </div>
        <div className="divide-y divide-slate-50">
          {members.map(m => (
            <div key={m.id} className="px-6 py-4 flex items-center gap-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${m.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600'}`}>
                {m.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
              </div>
              <p className="flex-1 text-sm font-medium text-slate-800 truncate">{m.email}</p>
              <select value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}
                disabled={!isConfigured}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border focus:outline-none ${m.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={() => handleDelete(m.id)} disabled={!isConfigured}
                className="text-slate-300 hover:text-red-400 transition disabled:opacity-30">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
