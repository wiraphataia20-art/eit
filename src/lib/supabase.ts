import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

export async function uploadFileToSupabase(file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('works')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('works').getPublicUrl(fileName)
  return data.publicUrl
}
