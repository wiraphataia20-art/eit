function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) {
    throw new Error('ยังไม่ได้ตั้งค่า Cloudinary — กรุณาเพิ่ม NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME และ NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET')
  }
  return { cloudName, uploadPreset }
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const { cloudName, uploadPreset } = getCloudinaryConfig()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  const data = await res.json()
  if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed')
  return data.secure_url
}

export async function uploadFileToCloudinary(file: File): Promise<string> {
  const { cloudName, uploadPreset } = getCloudinaryConfig()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
    method: 'POST',
    body: formData,
  })

  const data = await res.json()
  if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed')
  return data.secure_url
}
