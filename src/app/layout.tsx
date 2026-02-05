import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { clsx } from 'clsx'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AURA | Augmented Reasoning Assistant',
  description: 'A Gemini 3 powered multimodal reasoning engine that troubleshoots and analyzes reality in real-time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={clsx(inter.className, "antialiased selection:bg-cyan-500/30 selection:text-cyan-200")}>
        <div className="fixed inset-0 pointer-events-none z-50 mix-blend-overlay opacity-50 bg-[url('/noise.png')]"></div>
        <main className="min-h-screen flex flex-col relative overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  )
}
