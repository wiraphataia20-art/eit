import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ปฏิทินกิจกรรม',
  description: 'ปฏิทินกิจกรรมของสโมสรนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
  openGraph: {
    title: 'ปฏิทินกิจกรรม | SMO Engineering · PSRU',
    description: 'ปฏิทินกิจกรรมของสโมสรนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
    url: '/calendar',
  },
}

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children
}
