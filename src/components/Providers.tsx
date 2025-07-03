"use client"

import { ReactNode, useEffect, useState } from "react"
import dynamic from "next/dynamic"

interface ProvidersProps {
  children: ReactNode
}

// Dynamically import SessionProvider to ensure it only loads on client
const SessionProvider = dynamic(
  () => import("next-auth/react").then((mod) => mod.SessionProvider),
  { ssr: false }
)

export default function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-lg text-white">Loading...</div>
      </div>
    )
  }

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  )
}