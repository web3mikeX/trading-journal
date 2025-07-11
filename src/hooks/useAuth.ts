import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export function useAuth() {
  const { data: session, status } = useSession()
  const [demoMode, setDemoMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Initialize demo user in database with timeout
  useEffect(() => {
    const initDemo = async () => {
      try {
        // Add timeout to prevent infinite loading
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        const response = await fetch('/api/init-demo', { 
          method: 'POST',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize demo user:', error)
        setIsInitialized(true) // Continue anyway after timeout/error
      }
    }
    
    // Also set a fallback timeout
    const fallbackTimeout = setTimeout(() => {
      console.log('Fallback: Setting initialized to true after 3 seconds')
      setIsInitialized(true)
    }, 3000)
    
    initDemo().then(() => clearTimeout(fallbackTimeout))
    
    return () => clearTimeout(fallbackTimeout)
  }, [])
  
  // Return demo user for testing (after initialization or timeout)
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
  
  // Show loading while initializing (max 3 seconds)
  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  }
}