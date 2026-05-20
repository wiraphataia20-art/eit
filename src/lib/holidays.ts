export interface Holiday {
  id: string
  title: string
  month: number
  day: number
  type: 'holiday' | 'important'
}

export const ANNUAL_HOLIDAYS: Holiday[] = [
  // วันหยุดราชการ (สีแดง)
  { id: 'h-0101', title: 'วันขึ้นปีใหม่', month: 1, day: 1, type: 'holiday' },
  { id: 'h-0406', title: 'วันจักรี', month: 4, day: 6, type: 'holiday' },
  { id: 'h-0413', title: 'วันสงกรานต์', month: 4, day: 13, type: 'holiday' },
  { id: 'h-0414', title: 'วันสงกรานต์', month: 4, day: 14, type: 'holiday' },
  { id: 'h-0415', title: 'วันสงกรานต์', month: 4, day: 15, type: 'holiday' },
  { id: 'h-0501', title: 'วันแรงงานสากล', month: 5, day: 1, type: 'holiday' },
  { id: 'h-0504', title: 'วันฉัตรมงคล', month: 5, day: 4, type: 'holiday' },
  { id: 'h-0603', title: 'วันเฉลิมพระชนมพรรษา พระราชินี', month: 6, day: 3, type: 'holiday' },
  { id: 'h-0728', title: 'วันเฉลิมพระชนมพรรษา ร.10', month: 7, day: 28, type: 'holiday' },
  { id: 'h-0812', title: 'วันแม่แห่งชาติ', month: 8, day: 12, type: 'holiday' },
  { id: 'h-1013', title: 'วันคล้ายวันสวรรคต ร.9', month: 10, day: 13, type: 'holiday' },
  { id: 'h-1023', title: 'วันปิยมหาราช', month: 10, day: 23, type: 'holiday' },
  { id: 'h-1205', title: 'วันพ่อแห่งชาติ', month: 12, day: 5, type: 'holiday' },
  { id: 'h-1210', title: 'วันรัฐธรรมนูญ', month: 12, day: 10, type: 'holiday' },
  { id: 'h-1231', title: 'วันสิ้นปี', month: 12, day: 31, type: 'holiday' },
  // วันสำคัญ ไม่หยุดราชการ (สีเขียว)
  { id: 'h-0214', title: 'วันวาเลนไทน์', month: 2, day: 14, type: 'important' },
  { id: 'h-0308', title: 'วันสตรีสากล', month: 3, day: 8, type: 'important' },
  { id: 'h-0422', title: 'วันคุ้มครองโลก', month: 4, day: 22, type: 'important' },
  { id: 'h-0605', title: 'วันสิ่งแวดล้อมโลก', month: 6, day: 5, type: 'important' },
  { id: 'h-1105', title: 'วันลอยกระทง', month: 11, day: 5, type: 'important' },
  { id: 'h-1225', title: 'วันคริสต์มาส', month: 12, day: 25, type: 'important' },
]

export function getHolidaysForYear(year: number) {
  return ANNUAL_HOLIDAYS.map(h => ({
    ...h,
    startDate: new Date(year, h.month - 1, h.day),
    endDate: null,
    description: '',
  }))
}
