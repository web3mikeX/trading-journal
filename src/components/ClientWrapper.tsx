"use client"

import { ReactNode, useEffect, useState } from "react"

interface ClientWrapperProps {
  children: ReactNode
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-lg text-white">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}