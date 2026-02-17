import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Draped — AI Virtual Try-On',
  description: 'See yourself in any outfit instantly. Powered by diffusion AI.',
  keywords: ['virtual try-on', 'AI fashion', 'outfit preview', 'clothing AI'],
  openGraph: {
    title: 'Draped — AI Virtual Try-On',
    description: 'See yourself in any outfit instantly.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#faf7f2',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#231d19',
              color: '#faf7f2',
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
            },
            success: {
              iconTheme: { primary: '#c45c2a', secondary: '#faf7f2' },
            },
          }}
        />
      </body>
    </html>
  )
}
