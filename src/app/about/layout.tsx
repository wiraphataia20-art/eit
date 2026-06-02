import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'เกี่ยวกับสโมสร',
  description: 'ข้อมูลเกี่ยวกับสโมสรนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
  openGraph: {
    title: 'เกี่ยวกับสโมสร | SMO Engineering · PSRU',
    description: 'ข้อมูลเกี่ยวกับสโมสรนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
    url: '/about',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
