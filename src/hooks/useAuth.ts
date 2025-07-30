import { useEffect } from "react"

export function useAuth() {
  
  // Initialize demo user in database (non-blocking)
  useEffect(() => {
    const initDemo = async () => {
      try {
        const response = await fetch('/api/init-demo', { method: 'POST' })
        if (!response.ok) {
          console.warn('Demo user initialization returned non-OK status:', response.status)
        }
      } catch (error) {
        // Silently fail since this is non-blocking demo initialization
        // Error likely occurs during initial server startup
      }
    }
    
    // Add small delay to allow server to fully initialize
    const timer = setTimeout(initDemo, 1000)
    return () => clearTimeout(timer)
  }, [])
  
  // Always return demo user immediately
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