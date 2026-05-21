'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db, isConfigured } from '@/lib/firebase'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { Trash2, Plus, Settings, Users, List, X, User, Pencil } from 'lucide-react'

const DEFAULT_POSITIONS = [
  'ประธานสโมสร', 'รองประธานกิจการนักศึกษา', 'รองประธานประชาสัมพันธ์',
  'รองประธานบริหารงานทั่วไป', 'เลขานุการ', 'เหรัญญิก', 'ที่ปรึกษา',
]

const DEFAULT_DEPARTMENTS = [
  'ฝ่ายปฏิคม', 'ฝ่ายอาคารสถานที่', 'ฝ่ายโสตทัศนูปกรณ์', 'ฝ่ายกีฬา',
  'ฝ่ายประชาสัมพันธ์', 'ฝ่ายสันทนาการ', 'ฝ่ายศิลปะวัฒนธรรม', 'ฝ่ายสวัสดิการ', 'ฝ่ายพยาบาล',
]

type Tab = 'settings' | 'add' | 'list'

export default function AdminTeamPage() {
  const [tab, setTab] = useState<Tab>('add')
  const [positions, setPositions] = useState<string[]>(DEFAULT_POSITIONS)
  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS)
  const [newPosition, setNewPosition] = useState('')
  const [newDepartment, setNewDepartment] = useState('')

  const currentThaiYear = String(new Date().getFullYear() + 543)
  const [academicYear, setAcademicYear] = useState(currentThaiYear)
  const [group, setGroup] = useState<'บริหาร' | 'ฝ่าย'>('บริหาร')
  const [position, setPosition] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState<'หัวหน้าฝ่าย' | 'สมาชิก'>('สมาชิก')
  const [name, setName] = useState('')
  const [major, setMajor] = useState('')
  const [yearLevel, setYearLevel] = useState('')
  const [bio, setBio] = useState('')
  const [contactType, setContactType] = useState('Line')
  const [contactValue, setContactValue] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const [members, setMembers] = useState<any[]>([])
  const [filterYear, setFilterYear] = useState('')

  const [editingMember, setEditingMember] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editAcademicYear, setEditAcademicYear] = useState('')
  const [editGroup, setEditGroup] = useState<'บริหาร' | 'ฝ่าย'>('บริหาร')
  const [editPosition, setEditPosition] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [editRole, setEditRole] = useState<'หัวหน้าฝ่าย' | 'สมาชิก'>('สมาชิก')
  const [editContactType, setEditContactType] = useState('Line')
  const [editContactValue, setEditContactValue] = useState('')
  const [editMajor, setEditMajor] = useState('')
  const [editYearLevel, setEditYearLevel] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  async function loadConfig() {
    if (!isConfigured) return
    const snap = await getDoc(doc(db, 'config', 'team'))
    if (snap.exists()) {
      const data = snap.data()
      if (data.positions?.length) setPositions(data.positions)
      if (data.departments?.length) setDepartments(data.departments)
    } else {
      await setDoc(doc(db, 'config', 'team'), { positions: DEFAULT_POSITIONS, departments: DEFAULT_DEPARTMENTS })
    }
  }

  async function saveConfig(p: string[], d: string[]) {
    if (!isConfigured) return
    await setDoc(doc(db, 'config', 'team'), { positions: p, departments: d })
  }

  async function fetchMembers() {
    if (!isConfigured) return
    const q = query(collection(db, 'teamMembers'), orderBy('order', 'asc'))
    const snap = await getDocs(q)
    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { loadConfig(); fetchMembers() }, [])

  function addPosition() {
    const val = newPosition.trim()
    if (!val || positions.includes(val)) return
    const updated = [...positions, val]
    setPositions(updated); saveConfig(updated, departments); setNewPosition('')
  }

  function removePosition(p: string) {
    const updated = positions.filter(x => x !== p)
    setPositions(updated); saveConfig(updated, departments)
  }

  function addDepartment() {
    const val = newDepartment.trim()
    if (!val || departments.includes(val)) return
    const updated = [...departments, val]
    setDepartments(updated); saveConfig(positions, updated); setNewDepartment('')
  }

  function removeDepartment(d: string) {
    const updated = departments.filter(x => x !== d)
    setDepartments(updated); saveConfig(positions, updated)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfigured) { alert('ต้องตั้งค่า Firebase ก่อน'); return }
    setLoading(true)
    try {
      let imageUrl = ''
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile)
      await addDoc(collection(db, 'teamMembers'), {
        name, academicYear, group, major, yearLevel, bio,
        position: group === 'บริหาร' ? position : role,
        department: group === 'ฝ่าย' ? department : '',
        contactType, contactValue,
        imageUrl, order: Date.now(),
      })
      setName(''); setMajor(''); setYearLevel(''); setBio(''); setContactValue(''); setImageFile(null)
      fetchMembers()
    } catch (err: any) { alert(err.message) }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!isConfigured) return
    await deleteDoc(doc(db, 'teamMembers', id))
    fetchMembers()
  }

  function openEdit(member: any) {
    setEditingMember(member)
    setEditName(member.name || '')
    setEditAcademicYear(member.academicYear || '')
    setEditGroup(member.group || 'บริหาร')
    setEditDepartment(member.department || '')
    setEditContactType(member.contactType || 'Line')
    setEditContactValue(member.contactValue || '')
    setEditMajor(member.major || '')
    setEditYearLevel(member.yearLevel || '')
    setEditBio(member.bio || '')
    setEditImageFile(null)
    if (member.group === 'ฝ่าย') {
      setEditRole(member.position as any || 'สมาชิก')
      setEditPosition('')
    } else {
      setEditPosition(member.position || '')
      setEditRole('สมาชิก')
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!isConfigured || !editingMember) return
    setEditLoading(true)
    try {
      let imageUrl = editingMember.imageUrl || ''
      if (editImageFile) imageUrl = await uploadToCloudinary(editImageFile)
      await updateDoc(doc(db, 'teamMembers', editingMember.id), {
        name: editName,
        academicYear: editAcademicYear,
        group: editGroup,
        position: editGroup === 'บริหาร' ? editPosition : editRole,
        department: editGroup === 'ฝ่าย' ? editDepartment : '',
        contactType: editContactType,
        contactValue: editContactValue,
        major: editMajor,
        yearLevel: editYearLevel,
        bio: editBio,
        imageUrl,
      })
      setEditingMember(null)
      fetchMembers()
    } catch (err: any) { alert(err.message) }
    setEditLoading(false)
  }

  const years = [...new Set(members.map(m => m.academicYear).filter(Boolean))].sort().reverse() as string[]
  const filteredMembers = filterYear ? members.filter(m => m.academicYear === filterYear) : members

  const tabs = [
    { key: 'add' as Tab, icon: Plus, label: 'เพิ่มสมาชิก' },
    { key: 'list' as Tab, icon: List, label: 'รายชื่อ' },
    { key: 'settings' as Tab, icon: Settings, label: 'ตั้งค่า' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
          <Users size={20} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">จัดการทีมงาน</h1>
      </div>

      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
          Dev mode — ต้องตั้งค่า Firebase ก่อนจึงจะบันทึกได้
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm mb-6">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition ${tab === key ? 'bg-blue-700 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* Add Tab */}
      {tab === 'add' && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4">
          <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} required
            placeholder="ปีการศึกษา (เช่น 2567)"
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

          <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
            {(['บริหาร', 'ฝ่าย'] as const).map(g => (
              <button key={g} type="button" onClick={() => setGroup(g)}
                className={`flex-1 py-2.5 transition ${group === g ? 'bg-blue-700 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {g === 'บริหาร' ? 'คณะกรรมการบริหาร' : 'สมาชิกฝ่าย'}
              </button>
            ))}
          </div>

          {group === 'บริหาร' ? (
            <select value={position} onChange={e => setPosition(e.target.value)} required
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">เลือกตำแหน่ง</option>
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          ) : (
            <div className="flex gap-3">
              <select value={department} onChange={e => setDepartment(e.target.value)} required
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">เลือกฝ่าย</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={role} onChange={e => setRole(e.target.value as any)}
                className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="หัวหน้าฝ่าย">หัวหน้าฝ่าย</option>
                <option value="สมาชิก">สมาชิก</option>
              </select>
            </div>
          )}

          <input value={name} onChange={e => setName(e.target.value)} required placeholder="ชื่อ-นามสกุล"
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

          <div className="flex gap-3">
            <input value={major} onChange={e => setMajor(e.target.value)} placeholder="สาขาวิชา (ไม่บังคับ)"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <select value={yearLevel} onChange={e => setYearLevel(e.target.value)}
              className="w-32 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">ชั้นปี</option>
              {['ปี 1','ปี 2','ปี 3','ปี 4','จบการศึกษา'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="คำแนะนำตัว / คติประจำใจ (ไม่บังคับ)" rows={2}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

          <div className="flex gap-3">
            <select value={contactType} onChange={e => setContactType(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option>Line</option>
              <option>Instagram</option>
              <option>Facebook</option>
              <option value="อีเมล">อีเมล</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
            <input value={contactValue} onChange={e => setContactValue(e.target.value)}
              placeholder={contactType === 'Line' ? 'Line ID' : contactType === 'Instagram' ? '@handle' : contactType === 'อีเมล' ? 'email@...' : 'ช่องทางติดต่อ'}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">รูปภาพ (ไม่บังคับ)</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)}
              className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
          </div>

          <button type="submit" disabled={loading}
            className="bg-blue-700 text-white rounded-xl py-2 font-medium hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? 'กำลังบันทึก...' : 'เพิ่มสมาชิก'}
          </button>
        </form>
      )}

      {/* List Tab */}
      {tab === 'list' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">ทุกปีการศึกษา</option>
              {years.map(y => <option key={y} value={y}>ปีการศึกษา {y}</option>)}
            </select>
            <p className="text-sm text-slate-400">{filteredMembers.length} คน</p>
          </div>
          {filteredMembers.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <User size={20} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                <p className="text-xs text-rose-500 mt-0.5">
                  {item.group === 'ฝ่าย' ? `${item.department} · ${item.position}` : item.position}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">ปีการศึกษา {item.academicYear}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
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
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-700 mb-4 text-sm">ตำแหน่งคณะกรรมการบริหาร</h2>
            <div className="flex gap-2 mb-4">
              <input value={newPosition} onChange={e => setNewPosition(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPosition())}
                placeholder="เพิ่มตำแหน่งใหม่..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button type="button" onClick={addPosition}
                className="bg-blue-700 text-white rounded-xl px-4 py-2 hover:bg-blue-800 transition">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {positions.map(p => (
                <span key={p} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full">
                  {p}
                  <button type="button" onClick={() => removePosition(p)} className="text-blue-400 hover:text-red-500 transition">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-700 mb-4 text-sm">ฝ่ายต่างๆ</h2>
            <div className="flex gap-2 mb-4">
              <input value={newDepartment} onChange={e => setNewDepartment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDepartment())}
                placeholder="เพิ่มฝ่ายใหม่..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button type="button" onClick={addDepartment}
                className="bg-blue-700 text-white rounded-xl px-4 py-2 hover:bg-blue-800 transition">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {departments.map(d => (
                <span key={d} className="flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1.5 rounded-full">
                  {d}
                  <button type="button" onClick={() => removeDepartment(d)} className="text-rose-400 hover:text-red-500 transition">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-800">แก้ไขข้อมูลสมาชิก</h2>
              <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <input value={editAcademicYear} onChange={e => setEditAcademicYear(e.target.value)} required
                placeholder="ปีการศึกษา"
                className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

              <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
                {(['บริหาร', 'ฝ่าย'] as const).map(g => (
                  <button key={g} type="button" onClick={() => setEditGroup(g)}
                    className={`flex-1 py-2.5 transition ${editGroup === g ? 'bg-blue-700 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                    {g === 'บริหาร' ? 'คณะกรรมการบริหาร' : 'สมาชิกฝ่าย'}
                  </button>
                ))}
              </div>

              {editGroup === 'บริหาร' ? (
                <select value={editPosition} onChange={e => setEditPosition(e.target.value)} required
                  className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">เลือกตำแหน่ง</option>
                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <div className="flex gap-3">
                  <select value={editDepartment} onChange={e => setEditDepartment(e.target.value)} required
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">เลือกฝ่าย</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={editRole} onChange={e => setEditRole(e.target.value as any)}
                    className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="หัวหน้าฝ่าย">หัวหน้าฝ่าย</option>
                    <option value="สมาชิก">สมาชิก</option>
                  </select>
                </div>
              )}

              <input value={editName} onChange={e => setEditName(e.target.value)} required placeholder="ชื่อ-นามสกุล"
                className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

              <div className="flex gap-3">
                <input value={editMajor} onChange={e => setEditMajor(e.target.value)} placeholder="สาขาวิชา (ไม่บังคับ)"
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <select value={editYearLevel} onChange={e => setEditYearLevel(e.target.value)}
                  className="w-32 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">ชั้นปี</option>
                  {['ปี 1','ปี 2','ปี 3','ปี 4','จบการศึกษา'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="คำแนะนำตัว / คติประจำใจ (ไม่บังคับ)" rows={2}
                className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

              <div className="flex gap-3">
                <select value={editContactType} onChange={e => setEditContactType(e.target.value)}
                  className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option>Line</option>
                  <option>Instagram</option>
                  <option>Facebook</option>
                  <option value="อีเมล">อีเมล</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
                <input value={editContactValue} onChange={e => setEditContactValue(e.target.value)}
                  placeholder="ช่องทางติดต่อ"
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">เปลี่ยนรูปภาพ (ไม่บังคับ)</label>
                <input type="file" accept="image/*" onChange={e => setEditImageFile(e.target.files?.[0] || null)}
                  className="text-sm text-slate-500 border border-slate-200 rounded-xl px-4 py-2" />
              </div>

              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => setEditingMember(null)}
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
      )}
    </div>
  )
}
