import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export function useAuth() {
  const { data: session, status } = useSession()
  const [demoMode, setDemoMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Initialize demo user in database
  useEffect(() => {
    const initDemo = async () => {
      try {
        const response = await fetch('/api/init-demo', { method: 'POST' })
        if (response.ok) {
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Failed to initialize demo user:', error)
        setIsInitialized(true) // Continue anyway
      }
    }
    
    initDemo()
  }, [])
  
  // Return demo user for testing (after initialization)
  if (isInitialized) {
    return {
      user: {
        id: "cmcwu8b5m0001m17ilm0triy8",
        email: "degenbitkid@gmail.com",
        name: "mike",
        image: null,
      },
      isAuthenticated: true,
      isLoading: false,
    }
  }
  
  // Show loading while initializing
  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  }
}