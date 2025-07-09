import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export function useAuth() {
  const { data: session, status } = useSession()
  const [demoMode, setDemoMode] = useState(false)
  
  useEffect(() => {
    // Enable demo mode after initial load if no session
    if (status !== "loading" && !session) {
      setDemoMode(true)
    }
  }, [status, session])
  
  // For demo purposes, if there's no session, return a demo user
  if (status === "loading") {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
    }
  }
  
  if (!session && demoMode) {
    // Demo mode - return demo user with consistent ID
    return {
      user: {
        id: "demo-demo-example-com",
        email: "demo@example.com",
        name: "Demo User",
        image: null,
      },
      isAuthenticated: true,
      isLoading: false,
    }
  }
  
  return {
    user: session?.user || null,
    isAuthenticated: !!session,
    isLoading: status === "loading",
  }
}