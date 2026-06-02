import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'แกลเลอรี่',
  description: 'รูปภาพจากกิจกรรมต่างๆ ของสโมสรนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
  openGraph: {
    title: 'แกลเลอรี่ | SMO Engineering · PSRU',
    description: 'รูปภาพจากกิจกรรมต่างๆ ของสโมสรนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
    url: '/gallery',
  },
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children
}
