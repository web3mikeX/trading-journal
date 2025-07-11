import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export function useAuth() {
  const { data: session, status } = useSession()
  const [demoMode, setDemoMode] = useState(false)
  
  // Temporarily disable demo mode to allow real authentication
  // useEffect(() => {
  //   // Enable demo mode after initial load if no session
  //   if (status !== "loading" && !session) {
  //     setDemoMode(true)
  //   }
  // }, [status, session])
  
  // For demo purposes, if there's no session, return a demo user
  if (status === "loading") {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
    }
  }
  
  // Demo mode disabled for real authentication
  // if (!session && demoMode) {
  //   // Demo mode - return mike's user for testing with real data
  //   return {
  //     user: {
  //       id: "cmcwu8b5m0001m17ilm0triy8",
  //       email: "degenbitkid@gmail.com",
  //       name: "mike",
  //       image: null,
  //     },
  //     isAuthenticated: true,
  //     isLoading: false,
  //   }
  // }
  
  return {
    user: session?.user || null,
    isAuthenticated: !!session,
    isLoading: false,
  }
}