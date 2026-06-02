import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'คลังผลงาน',
  description: 'คลังผลงานของนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
  openGraph: {
    title: 'คลังผลงาน | SMO Engineering · PSRU',
    description: 'คลังผลงานของนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
    url: '/works',
  },
}

export default function WorksLayout({ children }: { children: React.ReactNode }) {
  return children
}
