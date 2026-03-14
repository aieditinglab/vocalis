import type { Metadata } from 'next'
import { Unbounded, DM_Sans } from 'next/font/google'
import './globals.css'

const unbounded = Unbounded({ subsets:['latin'], weight:['700','900'], variable:'--font-unbounded', display:'swap' })
const dmSans = DM_Sans({ subsets:['latin'], weight:['300','400','500','600'], variable:'--font-dm-sans', display:'swap' })

export const metadata: Metadata = {
  title: 'Vocalis — Train Your Voice. Own the Room.',
  description: 'AI-powered communication coaching for teens.',
  icons: { icon: '/favicon.svg' },
}

// Inline script prevents theme flash before React hydrates
const themeScript = `
(function(){
  try{
    var t=JSON.parse(localStorage.getItem('vocalis_settings')||'{}').theme||'dark';
    document.documentElement.setAttribute('data-theme',t);
  }catch(e){}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
