"use client"

import { ReactNode, useEffect, useState } from "react"

interface AuthWrapperProps {
  children: ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return <>{children}</>
}