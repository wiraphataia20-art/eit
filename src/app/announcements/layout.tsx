import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ประกาศกิจกรรม',
  description: 'ประกาศและกิจกรรมของสโมสรนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
  openGraph: {
    title: 'ประกาศกิจกรรม | SMO Engineering · PSRU',
    description: 'ประกาศและกิจกรรมของสโมสรนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
    url: '/announcements',
  },
}

export default function AnnouncementsLayout({ children }: { children: React.ReactNode }) {
  return children
}
