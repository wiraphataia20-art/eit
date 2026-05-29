import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(url && key)

export const supabase = isSupabaseConfigured
  ? createClient(url!, key!)
  : createClient('https://placeholder.supabase.co', 'placeholder')

export async function uploadFileToSupabase(file: File): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('ยังไม่ได้ตั้งค่า Supabase — กรุณาเพิ่ม NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน Vercel')
  }

  const folder = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const fileName = `${folder}/${file.name}`

  const { error } = await supabase.storage
    .from('works')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('works').getPublicUrl(fileName)
  return data.publicUrl
}
