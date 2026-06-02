import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'SMO Engineering · PSRU',
    template: '%s | SMO Engineering · PSRU',
  },
  description: 'สโมสรนักศึกษา คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏพิบูลสงคราม',
  icons: { icon: '/logo.png' },
  openGraph: {
    siteName: 'SMO Engineering · PSRU',
    locale: 'th_TH',
    type: 'website',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'SMO Engineering PSRU' }],
  },
  twitter: {
    card: 'summary',
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
