import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ทีมงานสโมสร',
  description: 'ทีมงานสโมสรนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
  openGraph: {
    title: 'ทีมงานสโมสร | SMO Engineering · PSRU',
    description: 'ทีมงานสโมสรนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
    url: '/team',
  },
}

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return children
}
