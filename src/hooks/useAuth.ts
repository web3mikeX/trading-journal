import { useEffect } from "react"

export function useAuth() {
  
  // Initialize demo user in database (non-blocking)
  useEffect(() => {
    const initDemo = async () => {
      try {
        await fetch('/api/init-demo', { method: 'POST' })
      } catch (error) {
        console.error('Failed to initialize demo user:', error)
      }
    }
    
    initDemo()
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